#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const evaluator = path.join(root, "verify.mjs");
const temp = await mkdtemp(path.join(os.tmpdir(), "vfp-eval-"));
const spec = `# Project Plan\n\n## Goal\nProduce a useful catalog.\n\n## Observable End State\nPeople can search the catalog.\n\n## Acceptance Criteria\n- [ ] **AC-1:** Search returns matching entries.\n\n## Verification Matrix\n| Requirement | Evidence / verification |\n| --- | --- |\n| AC-1 | Search verifier |\n`;
const tasks = `# Tasks\n\n## TASK-001 - Implement search\n### Objective\nImplement search behavior.\n### Tests\nRun verification/check.mjs.\n### Definition of Done\n- [ ] AC-1 passes.\n`;
const baseline = `# Baseline Results\n\nExecuted command: \`node verification/check.mjs\`\n\nResult: expected missing-behavior failure. Assertion failed because search is not implemented yet.\n`;
const verifier = `import assert from "node:assert/strict";\nassert.fail("search is not implemented");\n`;
function run(...args) { return spawnSync(process.execPath, args, { encoding: "utf8", timeout: 20000 }); }
async function workspace(name, withVerifier = true) {
 const dir = path.join(temp, name);
 await mkdir(path.join(dir, "docs", "plans", "catalog"), { recursive: true });
 await writeFile(path.join(dir, "docs", "plans", "catalog", "spec.md"), spec);
 await writeFile(path.join(dir, "docs", "plans", "catalog", "tasks.md"), tasks);
 await writeFile(path.join(dir, "docs", "plans", "catalog", "baseline.md"), baseline);
 if (withVerifier) { await mkdir(path.join(dir, "verification"), {recursive:true}); await writeFile(path.join(dir, "verification", "check.mjs"), verifier); }
 return dir;
}
try {
 let dir = await workspace("valid");
 let result = run(evaluator, dir);
 assert.equal(result.status, 0, `generic sample should pass\n${result.stdout}\n${result.stderr}`);
 dir = await workspace("no-verifier", false);
 result = run(evaluator, dir);
 assert.equal(result.status, 1, "missing documented verifier must fail");
 // An installed skill copy and its test tooling must not satisfy project verification discovery.
 dir = await workspace("installed-skill-copy", false);
 await mkdir(path.join(dir, ".agents", "skills", "verification-first-planning", "evals"), {recursive:true});
 await mkdir(path.join(dir, ".codex", "scripts"), {recursive:true});
 await mkdir(path.join(dir, "scripts"), {recursive:true});
 await mkdir(path.join(dir, "node_modules", "some-package"), {recursive:true});
 for (const file of [".agents/skills/verification-first-planning/evals/verify.mjs", ".codex/scripts/self-test.mjs", "scripts/validator-tests.mjs", "node_modules/some-package/test.js"]) await writeFile(path.join(dir,file), verifier);
 result = run(evaluator, dir);
 assert.equal(result.status, 1, "installed skill/tooling files must not count as project verifier");
 assert.match(result.stderr, /documented verifier artifact is missing: verification\/check.mjs/i);
 // An arbitrary project source file is considered an implementation boundary violation.
 dir = await workspace("implementation");
 for (const args of [["init", "-q"], ["add", "."], ["-c", "user.name=Eval", "-c", "user.email=eval@example.invalid", "commit", "-qm", "baseline"]]) {
  const git = spawnSync("git", args, { cwd: dir, encoding: "utf8" }); assert.equal(git.status, 0, git.stderr);
 }
 await mkdir(path.join(dir,"src"),{recursive:true}); await writeFile(path.join(dir,"src","catalog.mjs"),"export function search() { return []; }\n");
 result = run(evaluator,dir);
 assert.equal(result.status,1); assert.match(result.stderr,/outside planning\/verifier artifact locations/i);
 assert.equal(run(evaluator).status,2);
 assert.equal(run(evaluator,path.join(temp,"absent")).status,2);
 console.log("PASS: generic evaluator self-test (handoff, verifier, installed-skill exclusion, boundary, invocation)");
} finally { await rm(temp,{recursive:true,force:true}); }
