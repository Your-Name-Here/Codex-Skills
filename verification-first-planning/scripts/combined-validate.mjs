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
let validationFailed = false;
let invocationFailed = false;

for (const [label, script, argument] of validators) {
	console.log(`\n=== ${label} ===\n`);
	const result = spawnSync(process.execPath, [path.join(scriptsDir, script), argument], { stdio: "inherit" });
	if (result.error || result.signal || result.status === null) {
		console.error(`${label} validator terminated abnormally${result.error ? `: ${result.error.message}` : result.signal ? ` (signal ${result.signal})` : ""}.`);
		invocationFailed = true;
	} else if (result.status === 2) {
		invocationFailed = true;
	} else if (result.status !== 0) {
		validationFailed = true;
	}
}

console.log("");
if (invocationFailed) {
	console.error("✗ Planning package validation could not be completed.");
	process.exit(2);
}
if (validationFailed) {
	console.error("✗ Planning package validation failed.");
	process.exit(1);
}
console.log("✓ Planning package validation passed.");
