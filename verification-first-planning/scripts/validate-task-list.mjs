#!/usr/bin/env node

import path from "node:path";
import {
	countChecklistItems,
	error,
	getChildSections,
	getSections,
	hasErrors,
	hasTemplatePlaceholder,
	normalizeHeading,
	parseMarkdownFile,
	printIssues,
	sectionHasContent,
	sectionText,
	warning,
} from "./markdown-utils.mjs";

const filePath = process.argv[2];

if (!filePath) {
	console.error("Usage: node scripts/validate-task-list.mjs <task-list.md>");
	process.exit(2);
}

const TASK_PATTERN = /^TASK-(\d+)\b(?:\s*[-\u2013\u2014:]\s*)?(.*)$/i;

const REQUIRED_TASK_SECTIONS = [
	{
		label: "Objective",
		aliases: ["Objective"],
	},
	{
		label: "Behavior Affected",
		aliases: ["Behavior Affected", "Affected Behavior", "Behavior"],
	},
	{
		label: "Tests",
		aliases: ["Tests", "Tests Covering This Task", "Verification"],
	},
	{
		label: "Definition of Done",
		aliases: ["Definition of Done", "Done", "Completion Criteria"],
	},
];

async function main() {
	const absolutePath = path.resolve(filePath);

	let tree;

	try {
		tree = await parseMarkdownFile(absolutePath);
	} catch (cause) {
		console.error(`Unable to read ${absolutePath}`);

		if (cause instanceof Error) {
			console.error(cause.message);
		}

		process.exit(2);
	}

	const sections = getSections(tree);
	const issues = [];

	const tasks = parseTasks(sections);

	console.log(`Validating task list: ${absolutePath}`);
	console.log("");

	if (tasks.length === 0) {
		issues.push(
			error(
				"No tasks found. Expected headings such as '## TASK-001 - Description'.",
			),
		);
	}

	validateTaskIds(tasks, issues);
	validateTaskOrder(tasks, issues);

	for (const task of tasks) {
		validateTask(task, sections, issues);
	}

	printSummary(tasks, sections);

	console.log("");

	printIssues(issues);

	const errors = issues.filter((issue) => issue.severity === "error").length;

	const warnings = issues.filter(
		(issue) => issue.severity === "warning",
	).length;

	console.log("");
	console.log(`Result: ${errors} error(s), ${warnings} warning(s)`);

	if (hasErrors(issues)) {
		process.exit(1);
	}

	console.log("✓ Task-list validation passed.");
}

function parseTasks(sections) {
	const tasks = [];

	for (const section of sections) {
		const match = section.title.match(TASK_PATTERN);

		if (!match) {
			continue;
		}

		const number = Number(match[1]);

		tasks.push({
			section,
			id: `TASK-${String(number).padStart(3, "0")}`,
			number,
			title: match[2]?.trim() ?? "",
		});
	}

	return tasks;
}

function validateTaskIds(tasks, issues) {
	const seen = new Map();

	for (const task of tasks) {
		const existing = seen.get(task.number);

		if (existing) {
			issues.push(
				error(
					`Duplicate task number ${task.number}: "${existing.section.title}" and "${task.section.title}".`,
				),
			);
		} else {
			seen.set(task.number, task);
		}
	}
}

function validateTaskOrder(tasks, issues) {
	tasks.forEach((task, index) => {
		const expected = index + 1;

		if (task.number !== expected) {
			issues.push(
				error(
					`Expected task ${String(expected).padStart(3, "0")} at position ${index + 1}, found ${task.id}.`,
				),
			);
		}
	});
}

function validateTask(task, allSections, issues) {
	if (!task.title) {
		issues.push(error(`${task.id} has no descriptive title.`));
	} else if (hasTemplatePlaceholder(task.title)) {
		issues.push(error(`${task.id} title contains an unfilled template placeholder.`));
	}

	const children = getChildSections(allSections, task.section);

	for (const requirement of REQUIRED_TASK_SECTIONS) {
		const child = findChildSection(children, requirement.aliases);

		if (!child) {
			issues.push(error(`${task.id} is missing section: ${requirement.label}`));

			continue;
		}

		if (!sectionHasContent(child)) {
			issues.push(
				error(`${task.id} has an empty ${requirement.label} section.`),
			);
		} else if (hasTemplatePlaceholder(sectionText(child))) {
			issues.push(error(`${task.id} ${requirement.label} contains an unfilled template placeholder.`));
		}
	}

	validateDefinitionOfDone(task, children, issues);

	validateTests(task, children, issues);
}

function validateDefinitionOfDone(task, children, issues) {
	const section = findChildSection(children, [
		"Definition of Done",
		"Done",
		"Completion Criteria",
	]);

	if (!section) {
		return;
	}

	const checklist = countChecklistItems(section.nodes);

	if (checklist.total === 0) {
		issues.push(
			warning(`${task.id} Definition of Done contains no checklist items.`),
		);
	}
}

function validateTests(task, children, issues) {
	const section = findChildSection(children, [
		"Tests",
		"Tests Covering This Task",
		"Verification",
	]);

	if (!section) {
		return;
	}

	const text = section.nodes.map((node) => JSON.stringify(node)).join("\n");

	if (/none|n\/a|not applicable/i.test(text)) {
		issues.push(
			warning(
				`${task.id} declares no applicable tests. Confirm this is intentional.`,
			),
		);
	}
}

function findChildSection(sections, aliases) {
	const normalizedAliases = aliases.map(normalizeHeading);

	return sections.find((section) =>
		normalizedAliases.includes(section.normalizedTitle),
	);
}

function printSummary(tasks, sections) {
	let checklistTotal = 0;
	let checklistChecked = 0;

	for (const task of tasks) {
		const children = getChildSections(sections, task.section);

		const done = findChildSection(children, [
			"Definition of Done",
			"Done",
			"Completion Criteria",
		]);

		if (!done) {
			continue;
		}

		const stats = countChecklistItems(done.nodes);

		checklistTotal += stats.total;
		checklistChecked += stats.checked;
	}

	console.log("Task list");
	console.log(`  Tasks: ${tasks.length}`);
	console.log(`  Definition-of-done checks: ${checklistTotal}`);

	if (checklistTotal > 0) {
		console.log(`  Checked: ${checklistChecked}`);
		console.log(`  Unchecked: ${checklistTotal - checklistChecked}`);
	}
}

await main();
