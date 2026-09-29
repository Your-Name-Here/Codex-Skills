#!/usr/bin/env node

import path from "node:path";
import {
	countListItems,
	error,
	findSection,
	getSections,
	hasErrors,
	hasTemplatePlaceholder,
	parseMarkdownFile,
	printIssues,
	sectionHasContent,
	sectionHasTable,
	sectionText,
	warning,
} from "./markdown-utils.mjs";

const filePath = process.argv[2];

if (!filePath) {
	console.error("Usage: node scripts/validate-plan.mjs <plan.md>");
	process.exit(2);
}

const REQUIRED_SECTIONS = [
	{
		label: "Goal",
		aliases: ["Goal"],
	},
	{
		label: "Observable End State",
		aliases: ["Observable End State", "Observable End-State", "End State"],
	},
	{
		label: "Success Modes",
		aliases: ["Success Modes", "Success Cases", "Success Paths"],
	},
	{
		label: "Failure Modes",
		aliases: ["Failure Modes", "Failure Cases", "Failure Paths"],
	},
	{
		label: "Invariants",
		aliases: ["Invariants", "System Invariants"],
	},
	{
		label: "Verification Matrix",
		aliases: ["Verification Matrix", "Verification"],
	},
	{
		label: "Acceptance Criteria",
		aliases: ["Acceptance Criteria", "Acceptance Criterion"],
	},
	{
		label: "Baseline Results",
		aliases: [
			"Baseline Results",
			"Verification Baseline",
			"Baseline Verification Results",
		],
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

	console.log(`Validating plan: ${absolutePath}`);
	console.log("");

	if (sections.length === 0) {
		issues.push(error("Document contains no Markdown headings."));
	}

	for (const requirement of REQUIRED_SECTIONS) {
		const section = findSection(sections, requirement.aliases);

		if (!section) {
			issues.push(error(`Missing required section: ${requirement.label}`));

			continue;
		}

		if (!sectionHasContent(section)) {
			issues.push(error(`Section is empty: ${requirement.label}`));
		} else if (hasTemplatePlaceholder(sectionText(section))) {
			issues.push(error(`Section contains an unfilled template placeholder: ${requirement.label}`));
		}
	}

	validateSuccessModes(sections, issues);
	validateFailureModes(sections, issues);
	validateInvariants(sections, issues);
	validateVerificationMatrix(sections, issues);
	validateBaseline(sections, issues);
	validateHumanVerification(sections, issues);
	validateAcceptanceCriteria(sections, issues);
	validateVerificationPlaceholders(sections, issues);

	console.log("Plan structure");
	console.log(`  Headings: ${sections.length}`);
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

	console.log("✓ Plan validation passed.");
}

function validateAcceptanceCriteria(sections, issues) {
	const section = findSection(sections, ["Acceptance Criteria", "Acceptance Criterion"]);
	if (!section) return;
	const criteria = section.nodes.flatMap((node) => node.type === "list"
		? node.items.filter((item) => typeof item.checked === "boolean" && item.text.trim().length > 0)
		: []);
	if (criteria.length === 0) issues.push(error("Acceptance Criteria contains no meaningful checklist criterion."));
	else if (criteria.some((item) => hasTemplatePlaceholder(item.text))) issues.push(error("Acceptance Criteria contains an unfilled template placeholder."));
}

function validateVerificationPlaceholders(sections, issues) {
	for (const [label, aliases] of [["Verification Matrix", ["Verification Matrix", "Verification"]], ["Baseline Results", ["Baseline Results", "Verification Baseline", "Baseline Verification Results"]]]) {
		const section = findSection(sections, aliases);
		if (section && hasTemplatePlaceholder(sectionText(section))) issues.push(error(`${label} contains an unfilled template placeholder.`));
	}
}

function validateSuccessModes(sections, issues) {
	const section = findSection(sections, [
		"Success Modes",
		"Success Cases",
		"Success Paths",
	]);

	if (!section) {
		return;
	}

	const count = countListItems(section.nodes);

	if (count === 0 && !sectionHasContent(section)) {
		issues.push(error("Success Modes contains no defined behavior."));
	} else if (count === 0) {
		issues.push(
			warning(
				"Success Modes contains no list items. Confirm that success cases are explicitly distinguishable.",
			),
		);
	}
}

function validateFailureModes(sections, issues) {
	const section = findSection(sections, [
		"Failure Modes",
		"Failure Cases",
		"Failure Paths",
	]);

	if (!section) {
		return;
	}

	const count = countListItems(section.nodes);

	if (count === 0 && !sectionHasContent(section)) {
		issues.push(error("Failure Modes contains no defined behavior."));
	} else if (count === 0) {
		issues.push(
			warning(
				"Failure Modes contains no list items. Confirm that failure cases are explicitly distinguishable.",
			),
		);
	}
}

function validateInvariants(sections, issues) {
	const section = findSection(sections, ["Invariants", "System Invariants"]);

	if (!section) {
		return;
	}

	if (!sectionHasContent(section)) {
		issues.push(error("Invariants section is empty."));
	}
}

function validateVerificationMatrix(sections, issues) {
	const section = findSection(sections, [
		"Verification Matrix",
		"Verification",
	]);

	if (!section) {
		return;
	}

	if (!sectionHasTable(section)) {
		issues.push(
			warning("Verification Matrix does not contain a Markdown table."),
		);
	}

	const text = section.nodes.map((node) => JSON.stringify(node)).join("");

	if (!/requirement/i.test(text)) {
		issues.push(
			warning("Verification Matrix may be missing a Requirement column."),
		);
	}

	if (!/evidence|verification|test/i.test(text)) {
		issues.push(
			warning(
				"Verification Matrix may be missing evidence or verification information.",
			),
		);
	}
}

function validateBaseline(sections, issues) {
	const section = findSection(sections, [
		"Baseline Results",
		"Verification Baseline",
		"Baseline Verification Results",
	]);

	if (!section) {
		return;
	}

	const text = section.nodes.map((node) => node.text ?? node.rows?.join(" ") ?? node.items?.map((item) => item.text).join(" ") ?? "").join("\n");

	const fullText = section.nodes.map((node) => JSON.stringify(node)).join("\n");

	if (
		!/pass|fail|blocked|cannot|not run|pending|expected/i.test(
			`${text}\n${fullText}`,
		)
	) {
		issues.push(
			warning(
				"Baseline Results does not appear to record pass/fail/blocked state.",
			),
		);
	}
}

function validateHumanVerification(sections, issues) {
	const section = findSection(sections, [
		"Human Verification",
		"Human-Verification Requirements",
		"Human Verification Requirements",
	]);

	if (!section) {
		issues.push(
			warning(
				"No Human Verification section found. Add one when any requirement cannot be reliably automated.",
			),
		);
	}
}

await main();
