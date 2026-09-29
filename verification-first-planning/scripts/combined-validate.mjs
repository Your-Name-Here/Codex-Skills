#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [specPath, taskListPath] = process.argv.slice(2);
if (!specPath || !taskListPath) {
	console.error("Usage: node scripts/combined-validate.mjs <spec.md> <task-list.md>");
	process.exit(2);
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const validators = [
	["Feature specification", "validate-plan.mjs", specPath],
	["Task list", "validate-task-list.mjs", taskListPath],
];
let failed = false;

for (const [label, script, argument] of validators) {
	console.log(`\n=== ${label} ===\n`);
	const result = spawnSync(process.execPath, [path.join(scriptsDir, script), argument], { stdio: "inherit" });
	if (result.status !== 0) failed = true;
}

console.log("");
if (failed) {
	console.error("✗ Planning package validation failed.");
	process.exit(1);
}
console.log("✓ Planning package validation passed.");
