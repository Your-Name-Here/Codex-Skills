#!/usr/bin/env node
import { readdir, readFile, access, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const usage = () => { console.error("Usage: node evals/empty-repository-node-verifier/verify.mjs <post-skill-workspace>"); process.exit(2); };

if (process.argv.length !== 3) usage();
const workspace = path.resolve(process.argv[2]);
try { await access(workspace); } catch { console.error(`Setup error: workspace does not exist: ${workspace}`); process.exit(2); }
if (!(await stat(workspace)).isDirectory()) {
	console.error(`Setup error: workspace is not a directory: ${workspace}`); process.exit(2);
}

async function walk(dir, relative = "") {
	const files = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (entry.name === ".git" || entry.name === "node_modules") continue;
		const rel = path.join(relative, entry.name);
		if (entry.isDirectory()) files.push(...await walk(path.join(dir, entry.name), rel));
		else if (entry.isFile()) files.push({ path: path.join(workspace, rel), relative: rel.replaceAll("\\", "/") });
	}
	return files;
}
const files = await walk(workspace);
const markdown = files.filter((f) => f.relative.toLowerCase().endsWith(".md"));
const mdContents = await Promise.all(markdown.map(async (f) => [f, await readFile(f.path, "utf8")]));
const has = (rx) => mdContents.some(([, s]) => rx.test(s));

const spec = mdContents.find(([, s]) => /##\s+(Goal|Observable End State|Acceptance Criteria)/i.test(s) && /##\s+Acceptance Criteria/i.test(s));
if (!spec) fail("missing feature/project specification with observable contract and acceptance criteria");
const taskDoc = mdContents.find(([, s]) => /(?:^|\n)# Tasks\b|TASK-\d{3}/i.test(s) && /Definition of Done|Objective/i.test(s));
if (!taskDoc) fail("missing implementation task list");
if (!has(/Verification Matrix/i) || !has(/(?:\|\s*Requirement\s*\||\|\s*Criterion\s*\||##\s*Verification Matrix)/i)) fail("missing verification matrix");
const baseline = mdContents.find(([, s]) => /Baseline Results|Baseline Report|Baseline captured/i.test(s) && /(?:executed|ran|run)\b/i.test(s) && /node\s+\S+/i.test(s));
if (!baseline) fail("missing baseline results with execution evidence");
else if (!/(?:expected missing|expected fail|connection refused|ECONNREFUSED|\b404\b|unimplemented|not implemented)/i.test(baseline[1])) fail("baseline does not record a missing-implementation failure result");

const jsFiles = files.filter((f) => /\.(?:mjs|cjs|js)$/i.test(f.relative));
const jsContents = await Promise.all(jsFiles.map(async (f) => [f, await readFile(f.path, "utf8")]));
const candidates = jsContents.filter(([f, s]) => /node:test|from\s*["']node:test["']|require\(["']node:test["']\)/.test(s) && /\b(?:fetch|http\.request|https\.request|\.get\s*\(|\.post\s*\()/i.test(s) && /assert|expect\s*\(/i.test(s));
if (!candidates.length) fail("no executable Node verification artifact found that asserts behavior through an HTTP boundary");

const frameworkNames = /(?:^|[/@])(?:jest|vitest|mocha|ava|tap|playwright|@playwright\/test|cypress)(?:$|[/])/i;
const builtins = new Set(builtinModules.flatMap((name) => [name, name.replace(/^node:/, "")]));
for (const [artifact, source] of candidates) {
	const imports = [...source.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)["']/g)].map((m) => m[1]);
	const thirdParty = imports.filter((name) => !name.startsWith(".") && !builtins.has(name) && !builtins.has(name.replace(/^node:/, "")) && !frameworkNames.test(name));
	if (thirdParty.length) {
		fail(`verification artifact ${artifact.relative} imports third-party package(s): ${thirdParty.join(", ")}`);
	}
	if (imports.some((name) => frameworkNames.test(name))) fail(`verification artifact ${artifact.relative} requires a third-party test framework`);
}
for (const packageFile of files.filter((f) => path.basename(f.relative) === "package.json")) {
	try {
		const pkg = JSON.parse(await readFile(packageFile.path, "utf8"));
		const dependencyNames = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
		const addedFrameworks = dependencyNames.filter((name) => frameworkNames.test(name));
		if (addedFrameworks.length) fail(`package manifest adds third-party testing framework dependency: ${addedFrameworks.join(", ")}`);
	} catch (error) {
		if (error instanceof SyntaxError) fail(`invalid package manifest at ${packageFile.relative}`);
	}
}

const verifier = candidates.find(([f]) => mdContents.some(([, doc]) => doc.includes(path.basename(f.relative)) || doc.includes(f.relative)));
if (!verifier) fail("baseline/planning documents do not identify the executable verifier by path or filename");

if (verifier) {
	const [artifact, source] = verifier;
	const syntax = spawnSync(process.execPath, ["--check", artifact.path], { encoding: "utf8", timeout: 10000 });
	if (syntax.error || syntax.status !== 0) fail(`verifier has a syntax/setup error: ${(syntax.stderr || syntax.error?.message || "node --check failed").trim()}`);

	const commandRx = new RegExp(`(?:^|[\\s\x60])(node(?:\.exe)?\\s+(?:--test\\s+)?(?:[^\\s\x60]*[/\\\\])?${path.basename(artifact.relative).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=\\s|[\\x60]|$)`, "i");
	const docText = mdContents.map(([, s]) => s).join("\n");
	const commandMatch = baseline ? baseline[1].match(commandRx) : docText.match(commandRx);
	if (!commandMatch) fail(`baseline does not document a runnable Node command for ${artifact.relative}`);
	else {
		const documentedArgs = commandMatch[1].trim().split(/\s+/).slice(1).map((arg) => arg.replace(/^['"]|['"]$/g, ""));
		const artifactArg = documentedArgs.find((arg) => path.basename(arg) === path.basename(artifact.relative));
		if (!artifactArg) fail("documented verifier command does not pass the identified verification artifact");
		const executableArgs = documentedArgs.map((arg) => path.basename(arg) === path.basename(artifact.relative) ? artifact.path : arg);
		const result = spawnSync(process.execPath, executableArgs, {
			cwd: workspace, encoding: "utf8", timeout: 15000,
			env: { ...process.env, BASE_URL: "http://127.0.0.1:1" },
		});
		const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
		if (result.error || result.status === null) fail(`documented verifier command could not run: ${result.error?.message ?? "timed out"}`);
		else if (result.status === 0) fail("verifier passed against an unavailable baseline endpoint; expected a missing-implementation failure");
		else if (/(ERR_MODULE_NOT_FOUND|Cannot find (?:package|module)|SyntaxError|ERR_INVALID_URL|Invalid URL|ERR_INVALID_ARG_TYPE)/i.test(output)) fail(`verifier has a syntax, dependency, or setup defect: ${output.slice(0, 500).trim()}`);
		else if (!/(ECONNREFUSED|connection refused|fetch failed|failed to fetch|\b404\b|not found|ENOENT|no such file|connect ECONN)/i.test(output)) fail(`verifier failed for an unrecognized reason, not clear missing behavior: ${output.slice(0, 500).trim()}`);
		else if (!/(?:baseline|result|expected|executed|command|node\s+)/i.test(baseline?.[1] ?? "")) fail("baseline report does not say the verifier was executed and record its result");
	}

	const contracts = [
		[/\b(?:POST|\.post\s*\(|method\s*:\s*["']POST)/i, "URL creation"],
		[/assert\.(?:equal|strictEqual)\(\s*\w+\.status\s*,\s*(?:200|201|202)\s*\)/i, "assertion on URL creation response status"],
		[/assert\.(?:ok|equal|match|strictEqual)\([^\n]*(?:shortUrl|short_url|shortCode|short_code)/i, "assertion on returned short URL/code"],
		[/fetch\(\s*\w+\.shortUrl\s*,\s*\{[^}]*redirect\s*:\s*["']manual["']/is, "manual-follow redirect request to returned short URL"],
		[/assert\.(?:equal|strictEqual)\(\s*\w+\.status\s*,\s*30[1278]\s*\)/i, "assertion on redirect response status"],
		[/assert\.(?:equal|strictEqual)\([^\n]*headers\.get\(["']location["']\)/i, "assertion on redirect Location header"],
	];
	for (const [rx, label] of contracts) if (!rx.test(source)) fail(`verifier ${artifact.relative} does not visibly check ${label}`);
}

// Look for credible application code outside planning and verification areas.
const verifierPaths = new Set(candidates.map(([f]) => f.relative));
const sourceFiles = files.filter((f) => /\.(?:mjs|cjs|js|ts|tsx|jsx|py|go|rs|java|cs|sql)$/i.test(f.relative));
for (const f of sourceFiles) {
	const rel = f.relative.toLowerCase();
	if (verifierPaths.has(f.relative)) continue;
	if (/(?:^|\/)(?:docs?|plans?|planning|test|tests|spec|specs|verification|verifiers|evals)(?:\/|$)/.test(rel)) continue;
	if (/(?:^|\/)[^/]*(?:\.test|\.spec|test|spec|verify)[^/]*\.(?:mjs|cjs|js|ts|tsx|jsx)$/i.test(rel)) continue;
	const code = await readFile(f.path, "utf8");
	const endpoint = /(?:\/api\/)?(?:shorten|urls?)(?:\/|["'`]|\b)/i.test(code) && /(?:\.post\s*\(|method\s*:\s*["']POST|createServer|router?\s*\()/i.test(code);
	const redirects = /(?:status(?:Code)?\s*=\s*30[1278]|\.redirect\s*\(|writeHead\s*\(\s*30[1278]|Location\s*:)/i.test(code);
	const mapping = /(?:short_?urls?|url_?mappings?|CREATE\s+TABLE|sqlite|better-sqlite|Map\s*\(|Map\s*<)/i.test(code) && /(?:destination|target|original_?url|long_?url|url\b)/i.test(code);
	if ((endpoint && (redirects || mapping)) || (redirects && mapping)) fail(`possible URL-shortener implementation found outside verifier/planning artifacts: ${f.relative}`);
}

if (process.exitCode !== 1) console.log("PASS: empty-repository Node verifier eval");
else console.error("Eval failed. Review each invariant above.");
