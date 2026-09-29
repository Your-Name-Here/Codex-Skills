#!/usr/bin/env node
// Focused regression coverage for this skill's generated Markdown structures.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const planValidator = path.join(root, "scripts", "validate-plan.mjs");
const taskValidator = path.join(root, "scripts", "validate-task-list.mjs");
const combinedValidator = path.join(root, "scripts", "combined-validate.mjs");
const planTemplate = await readFile(path.join(root, "templates", "feature-spec.md"), "utf8");
const taskTemplate = await readFile(path.join(root, "templates", "task-list.md"), "utf8");
const goodPlan = `# Feature: Example\n\n## Goal\nUsers can save a report and see confirmation.\n\n## Observable End State\nA saved report appears in the report list.\n\n## Success Modes\n- Save succeeds and confirmation is shown.\n\n## Failure Modes\n- Unavailable storage shows an error.\n\n## Invariants\n- Existing reports remain available.\n\n## Acceptance Criteria\n- [ ] **AC-1:** Saving a report adds it to the list.\n\n## Verification Matrix\n| Requirement | Evidence / verification |\n| --- | --- |\n| AC-1 | Automated test |\n\n## Baseline Results\n- Existing checks: pass.\n\n## Human Verification\n- None required; automated checks cover the observable behavior.\n`;
const goodTasks = `# Tasks\n\n## TASK-001 - Add report saving\n### Objective\nImplement saving and record completion evidence.\n### Behavior Affected\nThe user can save a report.\n### Tests\nAutomated test covers AC-1 in the verification matrix.\n### Definition of Done\n- [ ] Saving works.\n`;

async function withFiles(files, callback) {
	const dir = await mkdtemp(path.join(os.tmpdir(), "vfp-validators-"));
	try {
		for (const [name, contents] of Object.entries(files)) await writeFile(path.join(dir, name), contents);
		return await callback(dir);
	} finally { await rm(dir, { recursive: true, force: true }); }
}
function run(script, ...args) { return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" }); }
function planStatus(contents) { return withFiles({ "plan.md": contents }, async (dir) => run(planValidator, path.join(dir, "plan.md"))); }
function taskStatus(contents) { return withFiles({ "tasks.md": contents }, async (dir) => run(taskValidator, path.join(dir, "tasks.md"))); }

test("untouched templates fail for placeholders", async () => {
	const plan = await planStatus(planTemplate);
	const tasks = await taskStatus(taskTemplate);
	assert.equal(plan.status, 1);
	assert.match(plan.stdout, /placeholder/i);
	assert.equal(tasks.status, 1);
	assert.match(tasks.stdout, /placeholder/i);
});
test("completed feature spec passes", async () => assert.equal((await planStatus(goodPlan)).status, 0));
test("Acceptance Criteria is required", async () => assert.equal((await planStatus(goodPlan.replace(/## Acceptance Criteria[\s\S]*?(?=## Verification Matrix)/, ""))).status, 1));
test("Acceptance Criteria requires a meaningful checklist item", async () => assert.equal((await planStatus(goodPlan.replace("- [ ] **AC-1:** Saving a report adds it to the list.", "No criteria yet."))).status, 1));
test("placeholder in required plan section fails", async () => assert.equal((await planStatus(goodPlan.replace("Users can save a report and see confirmation.", "[Outcome]"))).status, 1));
test("placeholder task title fails", async () => assert.equal((await taskStatus(goodTasks.replace("Add report saving", "[Outcome]"))).status, 1));
test("duplicate and malformed tasks fail", async () => {
	assert.equal((await taskStatus(goodTasks + goodTasks.replace("TASK-001", "TASK-001"))).status, 1);
	assert.equal((await taskStatus(goodTasks.replace("### Tests", "### Missing Tests"))).status, 1);
});
test("combined validator succeeds for valid documents", async () => withFiles({ "plan.md": goodPlan, "tasks.md": goodTasks }, async (dir) => assert.equal(run(combinedValidator, path.join(dir, "plan.md"), path.join(dir, "tasks.md")).status, 0)));
test("combined validator reports structural errors as 1", async () => withFiles({ "plan.md": goodPlan.replace("Users can save a report and see confirmation.", "[Outcome]"), "tasks.md": goodTasks }, async (dir) => assert.equal(run(combinedValidator, path.join(dir, "plan.md"), path.join(dir, "tasks.md")).status, 1)));
test("combined validator reports unavailable input as 2", async () => withFiles({ "plan.md": goodPlan, "tasks.md": goodTasks }, async (dir) => assert.equal(run(combinedValidator, path.join(dir, "absent.md"), path.join(dir, "tasks.md")).status, 2)));
