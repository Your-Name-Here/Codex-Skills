#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const evaluator = path.join(root, "verify.mjs");
const checker = path.resolve(root, "..", "scripts", "verify-contract-integrity.mjs");
const sealer = path.resolve(root, "..", "scripts", "seal-contract-verifiers.mjs");
const temp = await mkdtemp(path.join(os.tmpdir(), "vfp-eval-"));
const spec = `# Project Plan\n\n## Purpose\nPeople can search a catalog.\n\n## Success Criteria\n- Search returns matching entries.\n\n## Acceptance Criteria\n- [ ] **AC-1:** Search returns matching entries.\n\n## Verification Plan\n| ID | Check |\n| --- | --- |\n| AC-1 | Contract verifier |\n`;
const tasks = `# Implementation Plan\n\n## TASK-001 - Implement search\n### Objective\nImplement search behavior.\n### Verification\nRun the contract check after implementation.\n### Definition of Done\n- [ ] AC-1 passes.\n`;
const checkerCode = `import assert from "node:assert/strict";\nassert.fail("expected missing behavior: search is not implemented");\n`;
function run(executable, ...args) { return spawnSync(executable, args, { encoding: "utf8", timeout: 20000, windowsHide: true }); }
function node(...args) { return run(process.execPath, ...args); }
function nodeIn(cwd, ...args) { return spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 20000, windowsHide: true }); }
const digest = contents => createHash("sha256").update(contents).digest("hex");
async function workspace(name, artifactDir, baselineDoc, baselineFile = "run-notes.md") {
 const dir = path.join(temp, name), artifact = `${artifactDir}/contract-check.mjs`, manifest = "planning/acceptance-seal.json";
 await mkdir(path.join(dir, "planning"), { recursive: true });
 await writeFile(path.join(dir, "planning", "overview.md"), spec);
 await writeFile(path.join(dir, "planning", "work.md"), tasks);
 await writeFile(path.join(dir, "planning", baselineFile), baselineDoc(artifact, manifest));
 await mkdir(path.dirname(path.join(dir, artifact)), { recursive: true });
 await writeFile(path.join(dir, artifact), checkerCode);
 await writeFile(path.join(dir, manifest), `${JSON.stringify({version:1,revision:1,files:{[artifact]:{sha256:digest(checkerCode)}}},null,2)}\n`);
 return { dir, artifact, manifest };
}
const baselineA = (artifact, manifest) => `# Verification outcome\n\nCommand used: \`node ${artifact}\`\n\nObserved result: expected failure because required behavior is not implemented; assertion failed.\n\nContract verifier integrity manifest: \`${manifest}\`\nIntegrity check command: \`node scripts/verify-contract-integrity.mjs ${manifest} .\`.\n`;
const baselineB = (artifact, manifest) => `## Checks run\n\nVerifier invocation: node ${artifact}\n\nResult: expected missing-behavior failure (assertion identifies the absent behavior).\n\nIntegrity manifest: \`${manifest}\`\nIntegrity check: \`node scripts/verify-contract-integrity.mjs ${manifest} .\`.\n`;
try {
 // Flexible artifact locations, baseline filenames/headings, and equivalent handoff wording.
 for (const [name, dirName, baseline, baselineFile] of [["path-tests-contract", "tests/contract", baselineA, "baseline-notes.md"], ["path-acceptance", "acceptance", baselineB, "test-outcomes.md"], ["path-verification", "verification", baselineA, "verification-results.md"]]) {
  const sample = await workspace(name, dirName, baseline, baselineFile);
  const result = node(evaluator, sample.dir);
  assert.equal(result.status, 0, `${name} should pass generic eval\n${result.stdout}\n${result.stderr}`);
 }
 const tampered = await workspace("tampered-before-eval", "tests/contract", baselineA);
 await writeFile(path.join(tampered.dir, tampered.artifact), `${checkerCode}// changed after planning\n`);
 let tamperResult = node(evaluator, tampered.dir);
 assert.equal(tamperResult.status, 1, "generic eval must reject a changed planning-owned verifier");
 assert.match(tamperResult.stderr, /sealed verifier hash mismatch/i);

 // Seal generation and integrity outcomes: pass, mutation, unrelated tests, deletion, bad invocation.
 const sample = await workspace("integrity", "tests/contract", baselineA);
 let result = node(checker, path.join(sample.dir,sample.manifest), sample.dir);
 assert.equal(result.status, 0, `unchanged seal should pass: ${result.stderr}`);
 await mkdir(path.join(sample.dir, "tests", "unit"), {recursive:true});
 await writeFile(path.join(sample.dir, "tests", "unit", "implementation.test.mjs"), "export const unit = 1;\n");
 result = node(checker, path.join(sample.dir,sample.manifest), sample.dir); assert.equal(result.status, 0, "implementation-owned test must not affect manifest");
 await writeFile(path.join(sample.dir, "tests", "unit", "implementation.test.mjs"), "export const unit = 2;\n");
 result = node(checker, path.join(sample.dir,sample.manifest), sample.dir); assert.equal(result.status, 0, "modified implementation-owned test must not affect manifest");
 await writeFile(path.join(sample.dir, sample.artifact), `${checkerCode}// changed after handoff\n`);
 result = node(checker, path.join(sample.dir,sample.manifest), sample.dir); assert.equal(result.status, 1); assert.match(result.stderr, /modified: tests\/contract\/contract-check.mjs/i);
 await writeFile(path.join(sample.dir, sample.artifact), checkerCode);
 await (await import("node:fs/promises")).unlink(path.join(sample.dir, sample.artifact));
 result = node(checker, path.join(sample.dir,sample.manifest), sample.dir); assert.equal(result.status, 1); assert.match(result.stderr, /missing: tests\/contract\/contract-check.mjs/i);
 assert.equal(node(checker).status, 2, "missing manifest argument must return 2");
 assert.equal(node(checker, path.join(temp, "absent.json"), sample.dir).status, 2, "missing manifest must return 2");
 const badManifest = path.join(sample.dir, "planning", "bad.json"); await writeFile(badManifest, "{}");
 assert.equal(node(checker, badManifest, sample.dir).status, 2, "invalid manifest must return 2");
 await writeFile(path.join(sample.dir, sample.artifact), checkerCode);
 const generated = path.join(sample.dir, "planning", "generated.json");
 result = nodeIn(sample.dir, sealer, "planning/generated.json", sample.artifact);
 assert.equal(result.status, 0, `sealer should generate a manifest: ${result.stderr}`);
 assert.equal(node(checker, generated, sample.dir).status, 0, "generated manifest must verify");
 await writeFile(path.join(sample.dir, sample.artifact), `${checkerCode}// approved contract revision\n`);
 result = nodeIn(sample.dir, sealer, "planning/generated.json", sample.artifact);
 assert.equal(result.status, 0, `approved contract update should reseal: ${result.stderr}`);
 assert.equal(JSON.parse(await readFile(generated,"utf8")).revision, 2, "resealing must advance the manifest revision");
 assert.equal(node(checker, generated, sample.dir).status, 0, "new manifest revision must verify");
 result = nodeIn(sample.dir, sealer, "planning/generated.json", "tests/contract/missing.mjs");
 assert.equal(result.status, 2, "sealer setup errors must return 2");

 // Installed skill files and its own test/tooling artifacts cannot satisfy project discovery.
 const installed = await workspace("installed-skill", "tests/contract", baselineA);
 await (await import("node:fs/promises")).unlink(path.join(installed.dir, installed.artifact));
 await mkdir(path.join(installed.dir, ".agents", "skills", "verification-first-planning", "evals"), {recursive:true});
 await mkdir(path.join(installed.dir, ".codex", "scripts"), {recursive:true});
 await mkdir(path.join(installed.dir, "node_modules", "pkg"), {recursive:true});
 for (const file of [".agents/skills/verification-first-planning/evals/verify.mjs", ".codex/scripts/self-test.mjs", "node_modules/pkg/check.test.mjs", "scripts/validator-tests.mjs"]) {
  await mkdir(path.dirname(path.join(installed.dir,file)),{recursive:true}); await writeFile(path.join(installed.dir,file),checkerCode);
 }
 result = node(evaluator, installed.dir);
 assert.equal(result.status,1); assert.match(result.stderr,/documented verifier artifact is missing/i);

 assert.equal(node(evaluator).status,2, "missing workspace must return 2");
 assert.equal(node(evaluator,path.join(temp,"absent-workspace")).status,2,"missing workspace path must return 2");
 assert.equal(node(evaluator,installed.dir,path.join(temp,"missing-expectations.json")).status,2,"invalid expectation path must return 2");
 console.log("PASS: generic evaluator self-test (path/format flexibility, skill exclusions, integrity seal, invalid invocations)");
} finally { await rm(temp,{recursive:true,force:true}); }
