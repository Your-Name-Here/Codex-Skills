#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [specPath, taskListPath] = process.argv.slice(2);

if (!specPath || !taskListPath) {
	console.error("Usage: npm run validate:package -- <spec.md> <task-list.md>");
	process.exit(2);
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const validators = [
	{
		label: "Feature specification",
		script: path.join(scriptsDir, "validate-plan.ts"),
		argument: specPath,
	},
	{
		label: "Task list",
		script: path.join(scriptsDir, "validate-task-list.ts"),
		argument: taskListPath,
	},
];

let failed = false;

for (const validator of validators) {
	console.log("");
	console.log(`=== ${validator.label} ===`);
	console.log("");

	const result = spawnSync(
		process.execPath,
		["--import", "tsx", validator.script, validator.argument],
		{
			stdio: "inherit",
		},
	);

	if (result.status !== 0) {
		failed = true;
	}
}

console.log("");

if (failed) {
	console.error("✗ Planning package validation failed.");

	process.exit(1);
}

console.log("✓ Planning package validation passed.");
