#!/usr/bin/env node
// Generic evaluator for verification-first-planning handoffs.
import { createHash } from "node:crypto";
import { readdir, readFile, access, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const fail = message => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
if (process.argv.length < 3 || process.argv.length > 4) { console.error("Usage: node evals/verify.mjs <post-planning-workspace> [expectations.json]"); process.exit(2); }
const workspace = path.resolve(process.argv[2]);
try { await access(workspace); } catch { console.error(`Setup error: workspace does not exist: ${workspace}`); process.exit(2); }
if (!(await stat(workspace)).isDirectory()) { console.error(`Setup error: not a directory: ${workspace}`); process.exit(2); }
let expectations = { executableVerifierRequired: true };
if (process.argv[3]) try { expectations = { ...expectations, ...JSON.parse(await readFile(path.resolve(process.argv[3]), "utf8")) }; }
catch (error) { console.error(`Setup error: invalid expectations file: ${error.message}`); process.exit(2); }

const excludedDirs = new Set([".agents", ".codex", ".git", "node_modules", "evals"]);
const ignoredSkillFiles = /(?:^|\/)(?:self-test|self-tests|validator-tests|validate-plan|validate-task-list|combined-validate|markdown-utils|verify-contract-integrity|seal-contract-verifiers)(?:\.[^/]*)?$/i;
function isExcluded(relative) {
 const normalized = relative.replaceAll("\\", "/");
 return normalized.split("/").some(part => excludedDirs.has(part.toLowerCase())) || ignoredSkillFiles.test(normalized);
}
async function walk(dir, relative = "") {
 const found = [];
 for (const entry of await readdir(dir, { withFileTypes: true })) {
  const rel = relative ? `${relative}/${entry.name}` : entry.name;
  if (entry.isDirectory() && !excludedDirs.has(entry.name.toLowerCase())) found.push(...await walk(path.join(dir, entry.name), rel));
  else if (entry.isFile() && !isExcluded(rel)) found.push({ path: path.join(workspace, rel), relative: rel });
 }
 return found;
}
const files = await walk(workspace);
const markdown = await Promise.all(files.filter(f => f.relative.toLowerCase().endsWith(".md")).map(async f => ({ ...f, text: await readFile(f.path, "utf8") })));
const allText = markdown.map(f => f.text).join("\n");
const hasSpec = markdown.some(f => /##\s+(?:Goal|Purpose|Objective|Observable End State|Outcome|Requirements?)/i.test(f.text) && /##\s+(?:Acceptance Criteria|Success Criteria|Acceptance Requirements|Requirements)/i.test(f.text));
if (!hasSpec) fail("missing planning specification with an observable outcome and acceptance criteria");
if (!markdown.some(f => /(?:^|\n)#{1,3}\s*(?:Tasks|Implementation Plan|Work Plan)\b|TASK-\d{3}/im.test(f.text) && /(?:Definition of Done|Objective|Verification|Acceptance)/i.test(f.text))) fail("missing implementation task plan");
if (!markdown.some(f => /Verification Matrix|Verification Plan|Test Plan|Acceptance Verification/i.test(f.text) && /(?:\|\s*(?:Requirement|Criterion|ID)\s*\||##?\s*(?:Verification|Test) Plan)/i.test(f.text))) fail("missing verification mapping");

// Find documented runnable commands by their command-shaped contents, not document names/headings.
function tokenize(text) {
 const tokens = []; let token = "", quote = "";
 for (let i=0;i<text.length;i++) { const c=text[i]; if (quote) { if(c===quote) quote=""; else token+=c; } else if(c==="'"||c==='"') quote=c; else if(/\s/.test(c)){if(token){tokens.push(token);token="";}} else token+=c; }
 if (quote) throw new Error("unclosed quote"); if(token) tokens.push(token); return tokens;
}
const commandRuntimes = new Set(["node", "node.exe", "python", "python3", "python.exe", "python3.exe", "deno", "bun", "ruby", "php", "go", "dotnet", "cargo", "rustc", "pytest", "perl", "swift", "dart", "java", "javac", "rscript"]);
const commandCandidates = [];
const documentedCommands = [];
for (const doc of markdown) {
 const snippets = [...doc.text.matchAll(/`([^`\n]+)`/g)].map(m => m[1]).concat([...doc.text.matchAll(/```(?:sh|bash|shell|powershell|pwsh)?\s*\n([\s\S]*?)```/gi)].flatMap(m => m[1].split(/\r?\n/)));
 for (const line of doc.text.split(/\r?\n/)) {
  const raw = line.trim().replace(/^[-*]\s*/, "").replace(/^(?:(?:verifier\s+)?(?:command|invocation)|run(?:\s+command)?|execute(?:d)?(?:\s+command)?)\s*[:=-]\s*/i, "");
  if (/^(?:node(?:\.exe)?|python3?(?:\.exe)?|deno|bun|ruby|php|go|dotnet|cargo|rustc|pytest|perl|swift|dart|java|javac|rscript)\s+/i.test(raw)) snippets.push(raw);
 }
 for (const snippet of snippets) {
  let args; try { args = tokenize(snippet.trim().replace(/^\$\s*/, "")); } catch { continue; }
  if (!commandRuntimes.has(path.basename(args[0] ?? "").toLowerCase())) continue;
  const entry = { doc, command: snippet.trim().replace(/^\$\s*/, ""), args };
  documentedCommands.push(entry);
  if (!args.some(arg => ignoredSkillFiles.test(arg.replaceAll("\\", "/")))) commandCandidates.push(entry);
 }
}
// Prefer commands documented in a results/baseline passage with a recorded outcome.
const command = commandCandidates.find(c => /(?:result|outcome|baseline|executed|ran|verification run|test run)/i.test(c.doc.text)) ?? commandCandidates[0];
const outcomeDoc = command && (markdown.find(f => f === command.doc && /(?:result|outcome|baseline|executed|ran|verification run|test run)/i.test(f.text)) ?? command.doc);
if (expectations.executableVerifierRequired && !command) fail("handoff does not document a directly executable verification command");
if (expectations.executableVerifierRequired && !outcomeDoc) fail("missing recorded product verification baseline");
if (expectations.executableVerifierRequired && !documentedCommands.some(c => c.args.slice(1).some(arg => /integrity|manifest/i.test(arg)) && /(?:integrity|manifest)/i.test(c.doc.text))) fail("handoff does not document how to run the contract verifier integrity check");
const manifestMention = allText.match(/(?:integrity\s+)?manifest\b[^\n]{0,180}?(?:`([^`]+\.json)`|((?:[\w.-]+[\\/])*[\w.-]+\.json))/i)?.slice(1).find(Boolean)
 ?? allText.match(/`([^`]+\.json)`[^\n]{0,180}(?:integrity\s+)?manifest/i)?.[1];
let integrityValid = true;
const integrityManifestFiles = new Set();

// Check the seal before executing the documented contract acceptance command.
if (expectations.executableVerifierRequired && !manifestMention) { fail("handoff does not identify its contract verifier integrity manifest"); integrityValid = false; }
if (manifestMention) {
 const manifestPath = path.resolve(workspace, manifestMention);
 if (!manifestPath.startsWith(workspace + path.sep) || isExcluded(path.relative(workspace, manifestPath))) { fail("integrity manifest points outside project artifacts"); integrityValid = false; }
 else try {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.version !== 1 || !Number.isInteger(manifest.revision) || manifest.revision < 1 || !manifest.files || typeof manifest.files !== "object" || !Object.keys(manifest.files).length) { fail("invalid contract verifier integrity manifest"); integrityValid = false; }
  else for (const [relative, record] of Object.entries(manifest.files)) {
   integrityManifestFiles.add(relative.replaceAll("\\", "/"));
   const target = path.resolve(workspace, relative);
   if (!target.startsWith(workspace + path.sep) || isExcluded(path.relative(workspace, target))) { fail(`sealed verifier path is outside project artifacts: ${relative}`); integrityValid = false; continue; }
   try {
    const actual = createHash("sha256").update(await readFile(target)).digest("hex");
    if (actual !== record?.sha256) { fail(`sealed verifier hash mismatch: ${relative}`); integrityValid = false; }
   } catch { fail(`sealed verifier is missing: ${relative}`); integrityValid = false; }
  }
 } catch (error) { fail(`cannot read contract verifier manifest: ${error.message}`); integrityValid = false; }
}

// Validate every explicit verifier path mentioned in the documented command. Paths can live
// in any project directory; skill/tooling locations are excluded independent of file extension.
let commandArtifact = null;
if (command) {
 const verifierExt = "mjs|cjs|js|py|sh|rb|php|go|rs|java|cs|csproj|sln|jar|swift|dart|pl|r";
 const paths = [...command.args.slice(1).filter(arg => new RegExp(`\\.(?:${verifierExt})$`, "i").test(arg))];
 for (const doc of markdown) for (const match of doc.text.matchAll(new RegExp(`(?:[\\w.-]+[\\\\/])+[\\w.-]+\\.(?:${verifierExt})(?![\\w])|\\b[\\w.-]+\\.(?:${verifierExt})\\b`, "gi"))) if (!isExcluded(match[0])) paths.push(match[0]);
 const uniquePaths = [...new Set(paths)];
 if (!uniquePaths.length) fail("handoff does not identify the executable verifier artifact path");
 if (uniquePaths.length && !uniquePaths.some(ref => integrityManifestFiles.has(path.relative(workspace, path.resolve(workspace, ref)).replaceAll("\\", "/")))) fail("integrity manifest does not seal the documented executable verifier");
 for (const ref of uniquePaths) {
  const target = path.resolve(workspace, ref);
  if (!target.startsWith(workspace + path.sep)) { fail(`verifier reference escapes workspace: ${ref}`); continue; }
  const relative = path.relative(workspace, target).replaceAll("\\", "/");
  if (isExcluded(relative)) { fail(`verifier reference points into installed skill/tooling files: ${ref}`); continue; }
  try { await access(target); } catch { fail(`documented verifier artifact is missing: ${ref}`); continue; }
  commandArtifact ??= { target, relative };
 }
 if (commandArtifact && integrityValid) {
  const result = spawnSync(command.args[0], command.args.slice(1), { cwd: workspace, encoding: "utf8", timeout: 30000, windowsHide: true });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.error || result.status === null) fail(`documented verifier could not execute: ${result.error?.message ?? "timeout"}`);
  else {
   if (/(SyntaxError|ModuleNotFoundError|ERR_MODULE_NOT_FOUND|Cannot find module|No such file or directory|command not found|Traceback \(most recent call last\))/i.test(output)) fail(`verifier/setup defect detected: ${output.slice(0,400).trim()}`);
   const observed = result.status === 0 ? "pass" : "fail";
   const record = outcomeDoc?.text ?? "";
   const expected = /(?:expected.{0,32}(?:failure|fail)|(?:failure|fail).{0,32}expected|missing[- ](?:product )?behavior|not implemented|unimplemented)/i.test(record) ? "fail" : /(?:(?:result|outcome|status)\s*:?\s*(?:pass|passed|success)|\bchecks?\s+(?:all\s+)?pass(?:ed)?\b|\bsuccessfully passed\b|\bexit code 0\b)/i.test(record) ? "pass" : null;
   if (!expected) fail("product baseline does not classify the recorded result as pass or expected missing-behavior failure");
   else if (expected !== observed) fail(`recorded baseline says ${expected}, but verifier exited ${result.status}`);
   if (observed === "fail" && !/(?:assert|expected|missing|not implemented|unavailable|refused|\b404\b|failed)/i.test(output)) fail(`verifier failure does not identify missing behavior: ${output.slice(0,400).trim()}`);
  }
 }
}

// Where Git metadata exists, detect newly changed product source without penalizing pre-existing files.
const allowedArtifact = /^(?:docs?\/plans?\/|planning\/|verification\/|verifiers?\/|tests?\/|acceptance\/|specs?\/)/i;
const git = spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: workspace, encoding: "utf8", timeout: 10000, windowsHide: true });
if (!git.error && git.status === 0) for (const line of git.stdout.split(/\r?\n/).filter(Boolean)) {
 const relative = line.slice(3).replaceAll("\\", "/").replace(/^"|"$/g, "");
 if (!/\.(?:mjs|cjs|js|ts|tsx|jsx|py|go|rs|java|cs|sql)$/i.test(relative) || relative.split("/").some(part => excludedDirs.has(part.toLowerCase()))) continue;
 if (!allowedArtifact.test(relative) && !/(?:^|\/)(?:test|spec|verify)[^/]*\./i.test(relative)) fail(`executable file changed during planning outside planning/verifier artifact locations: ${relative}`);
}
if (process.exitCode !== 1) console.log("PASS: generic verification-first-planning eval");
