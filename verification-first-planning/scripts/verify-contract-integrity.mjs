#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

function usage() {
 console.error("Usage: node scripts/verify-contract-integrity.mjs <manifest.json> [workspace-root]");
 process.exit(2);
}
if (process.argv.length < 3 || process.argv.length > 4) usage();

const manifestPath = path.resolve(process.argv[2]);
const root = path.resolve(process.argv[3] ?? path.dirname(manifestPath));
let realRoot;
try { realRoot = await realpath(root); }
catch (error) { console.error(`Setup error: workspace root is unavailable: ${error.message}`); process.exit(2); }
let manifest;
try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
catch (error) { console.error(`Setup error: cannot read manifest ${manifestPath}: ${error.message}`); process.exit(2); }
if (!manifest || manifest.version !== 1 || !Number.isInteger(manifest.revision) || manifest.revision < 1 || !manifest.files || typeof manifest.files !== "object" || Array.isArray(manifest.files) || Object.keys(manifest.files).length === 0) {
 console.error("Setup error: manifest must contain version 1, a positive revision, and a non-empty files object"); process.exit(2);
}

let failed = false;
for (const [relative, record] of Object.entries(manifest.files)) {
 if (typeof record?.sha256 !== "string" || !/^[a-f\d]{64}$/i.test(record.sha256)) {
  console.error(`Setup error: invalid SHA-256 for ${relative}`); process.exitCode = 2; continue;
 }
 const target = path.resolve(root, relative);
 if (target === root || !target.startsWith(root + path.sep)) {
  console.error(`Setup error: manifest path escapes workspace: ${relative}`); process.exitCode = 2; continue;
 }
 let content;
 try {
  const actualTarget = await realpath(target);
  if (!actualTarget.startsWith(realRoot + path.sep)) { console.error(`Setup error: verifier path resolves outside workspace: ${relative}`); process.exitCode = 2; continue; }
  content = await readFile(actualTarget);
 }
 catch (error) { console.error(`FAIL: sealed verifier is missing: ${relative} (${error.message})`); failed = true; continue; }
 const actual = createHash("sha256").update(content).digest("hex");
 if (actual !== record.sha256.toLowerCase()) { console.error(`FAIL: sealed verifier was modified: ${relative}\n  expected ${record.sha256.toLowerCase()}\n  actual   ${actual}`); failed = true; }
}
if (process.exitCode === 2) process.exit(2);
if (failed) process.exit(1);
console.log(`PASS: ${Object.keys(manifest.files).length} sealed verifier file(s) match revision ${manifest.revision} in ${path.relative(root, manifestPath) || path.basename(manifestPath)}`);
