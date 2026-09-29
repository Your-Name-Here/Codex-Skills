#!/usr/bin/env node
// Generic evaluator for verification-first-planning handoffs.
import { readdir, readFile, access, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
if (process.argv.length < 3 || process.argv.length > 4) { console.error("Usage: node evals/verify.mjs <post-planning-workspace> [expectations.json]"); process.exit(2); }
const workspace = path.resolve(process.argv[2]);
try { await access(workspace); } catch { console.error(`Setup error: workspace does not exist: ${workspace}`); process.exit(2); }
if (!(await stat(workspace)).isDirectory()) { console.error(`Setup error: not a directory: ${workspace}`); process.exit(2); }
let expectations = { executableVerifierRequired: true };
if (process.argv[3]) {
 try { expectations = { ...expectations, ...JSON.parse(await readFile(path.resolve(process.argv[3]), "utf8")) }; }
 catch (error) { console.error(`Setup error: invalid expectations file: ${error.message}`); process.exit(2); }
}

const excluded = new Set([".agents", ".codex", ".git", "node_modules", "evals", "scripts", "self-tests", "tests"]);
async function walk(dir, relative = "") {
 const found = [];
 for (const entry of await readdir(dir, { withFileTypes: true })) {
  const rel = relative ? `${relative}/${entry.name}` : entry.name;
  if (entry.isDirectory() && !excluded.has(entry.name.toLowerCase())) found.push(...await walk(path.join(dir, entry.name), rel));
  else if (entry.isFile()) found.push({ path: path.join(workspace, rel), relative: rel });
 }
 return found;
}
const files = await walk(workspace);
const md = await Promise.all(files.filter(f => f.relative.toLowerCase().endsWith(".md")).map(async f => ({...f, text: await readFile(f.path,"utf8")})));
const handoff = md.filter(f => /(?:acceptance criteria|verification matrix|task list|implementation plan|(?:^|\n)# Tasks\b|TASK-\d{3})/i.test(f.text));
const spec = handoff.some(f => /##\s+(?:Goal|Observable End State)/i.test(f.text) && /##\s+Acceptance Criteria/i.test(f.text));
if (!spec) fail("missing planning specification with observable end state and acceptance criteria");
if (!handoff.some(f => /(?:^|\n)# Tasks\b|TASK-\d{3}/i.test(f.text) && /Definition of Done|Objective/i.test(f.text))) fail("missing implementation task list");
if (!handoff.some(f => /Verification Matrix/i.test(f.text) && /(?:\|\s*(?:Requirement|Criterion)\s*\||##\s*Verification Matrix)/i.test(f.text))) fail("missing verification matrix");
const baseline = md.find(f => /(?:baseline results|baseline report)/i.test(f.text) && /(?:executed|ran|run)\b/i.test(f.text));
if (expectations.executableVerifierRequired && !baseline) fail("missing baseline that states verification was executed");

const evidenceDoc = baseline ?? handoff.find(f => /verification|baseline/i.test(f.text));
const commandLine = evidenceDoc?.text.match(/(?:Executed command|Command run|Run command)\s*:\s*`([^`]+)`/i)?.[1];
const artifactRefs = [...(evidenceDoc?.text.matchAll(/`([^`]+)`/g) ?? [])].map(m=>m[1]).filter(v => /\.(?:mjs|cjs|js|py|sh|ps1|rb|go|rs|java|class)$/i.test(v));
let command = commandLine;
if (expectations.executableVerifierRequired && !command && artifactRefs.length === 1) fail("baseline must document the exact command used to run its verifier");
if (expectations.executableVerifierRequired && !command) fail("handoff does not document an executable verifier command in the baseline");

function tokenize(commandText) {
 const out = []; let token = "", quote = "";
 for (let i=0;i<commandText.length;i++) { const c=commandText[i]; if (quote) { if(c===quote) quote=""; else token+=c; } else if(c==="'"||c==='"') quote=c; else if(/\s/.test(c)){if(token){out.push(token);token="";}} else token+=c; }
 if(quote) throw new Error("unclosed quote in documented command"); if(token) out.push(token); return out;
}
const launchers = new Set(["node", "node.exe", "python", "python3", "python.exe", "python3.exe"]);
if (command) try {
 const args = tokenize(command);
 let referencesValid = true;
 if (!launchers.has(path.basename(args[0] ?? "").toLowerCase())) fail("documented verifier must use a supported direct executable command (node or python)");
 else {
  const resolved = args.slice(1).filter(a => !a.startsWith("-"));
  for (const ref of resolved) {
   if (/^[\w.-]+$/.test(ref) && !/\.(?:mjs|cjs|js|py)$/i.test(ref) && !["test", "unittest"].includes(ref)) continue;
   const target = path.resolve(workspace, ref);
   if (!target.startsWith(workspace + path.sep)) { fail(`verifier reference escapes workspace: ${ref}`); referencesValid = false; continue; }
   const rel = path.relative(workspace,target).replaceAll("\\","/").split("/");
   if (rel.some(part => excluded.has(part.toLowerCase()))) { fail(`verifier reference points into excluded skill/tooling artifacts: ${ref}`); referencesValid = false; continue; }
   try { await access(target); } catch { fail(`documented verifier artifact is missing: ${ref}`); referencesValid = false; }
  }
  if (!referencesValid) throw new Error("documented verifier artifacts are invalid");
  const result = spawnSync(args[0], args.slice(1), { cwd: workspace, encoding: "utf8", timeout: 30000, windowsHide: true });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.error || result.status === null) fail(`documented verifier could not execute: ${result.error?.message ?? "timeout"}`);
  else {
   if (/(SyntaxError|ModuleNotFoundError|ERR_MODULE_NOT_FOUND|Cannot find module|No such file or directory|command not found|Traceback \(most recent call last\))/i.test(output)) fail(`verifier/setup defect detected: ${output.slice(0,400).trim()}`);
   const observed = result.status === 0 ? "pass" : "fail";
   const record = baseline?.text ?? "";
   const expected = /(?:expected (?:failure|fail|to fail)|missing behavior|not implemented|unimplemented)/i.test(record) ? "fail" : /(?:result|outcome)\s*:\s*(?:pass|passed|success)/i.test(record) ? "pass" : null;
   if (!expected) fail("baseline must classify its recorded verifier result as pass or expected missing-behavior failure");
   else if (expected !== observed) fail(`recorded baseline says ${expected}, but verifier exited ${result.status}`);
   if (observed === "fail" && !/(?:assert|expected|missing|not implemented|unavailable|refused|404|failed)/i.test(output)) fail(`verifier failure does not identify missing behavior: ${output.slice(0,400).trim()}`);
  }
 }
} catch (error) { fail(`cannot parse documented command: ${error.message}`); }
if (!expectations.executableVerifierRequired && !command) console.log("INFO: scenario does not require an executable verifier");

// Product behavior must not be implemented during planning. Use repository changes,
// when available, so pre-existing project source is not mistaken for planning output.
const allowed = /^(?:docs?\/plans?\/|planning\/|verification\/|verifiers?\/|tests?\/|specs?\/)/i;
const git = spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: workspace, encoding: "utf8", timeout: 10000, windowsHide: true });
if (!git.error && git.status === 0) for (const line of git.stdout.split(/\r?\n/).filter(Boolean)) {
 const relative = line.slice(3).replaceAll("\\", "/").replace(/^"|"$/g, "");
 if (!/\.(?:mjs|cjs|js|ts|tsx|jsx|py|go|rs|java|cs|sql)$/i.test(relative)) continue;
 if (relative.split("/").some(part => excluded.has(part.toLowerCase()))) continue;
 if (!allowed.test(relative) && !/(?:^|\/)(?:test|spec|verify)[^/]*\./i.test(relative)) fail(`executable file changed during planning outside planning/verifier artifact locations: ${relative}`);
}

if (process.exitCode !== 1) console.log("PASS: generic verification-first-planning eval");
