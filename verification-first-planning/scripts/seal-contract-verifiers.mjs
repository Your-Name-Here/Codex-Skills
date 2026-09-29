#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

if (process.argv.length < 4) {
 console.error("Usage: node scripts/seal-contract-verifiers.mjs <manifest.json> <verifier-file> [verifier-file ...]"); process.exit(2);
}
const manifestPath = path.resolve(process.argv[2]);
const root = path.resolve(process.cwd());
const realRoot = await realpath(root);
let revision = 1;
try {
 const previous = JSON.parse(await readFile(manifestPath, "utf8"));
 if (previous.version !== 1 || !previous.files || typeof previous.files !== "object" || Array.isArray(previous.files)) throw new Error("existing manifest has an unsupported or invalid format");
 if (previous.revision !== undefined && (!Number.isInteger(previous.revision) || previous.revision < 1)) throw new Error("existing manifest has an invalid revision");
 revision = (previous.revision ?? 1) + 1;
} catch (error) {
 if (error.code !== "ENOENT") { console.error(`Setup error: cannot update existing manifest: ${error.message}`); process.exit(2); }
}
const files = {};
for (const given of process.argv.slice(3)) {
 const target = path.resolve(root, given);
 if (target === root || !target.startsWith(root + path.sep)) { console.error(`Setup error: verifier path escapes workspace: ${given}`); process.exit(2); }
 let bytes;
 try {
  const actualTarget = await realpath(target);
  if (!actualTarget.startsWith(realRoot + path.sep)) { console.error(`Setup error: verifier path resolves outside workspace: ${given}`); process.exit(2); }
  bytes = await readFile(actualTarget);
 }
 catch (error) { console.error(`Setup error: cannot read verifier ${given}: ${error.message}`); process.exit(2); }
 const relative = path.relative(root, target).replaceAll("\\", "/");
 files[relative] = { sha256: createHash("sha256").update(bytes).digest("hex") };
}
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify({ version: 1, revision, files }, null, 2)}\n`, "utf8");
console.log(`Sealed ${Object.keys(files).length} verifier file(s) at revision ${revision} in ${manifestPath}`);
