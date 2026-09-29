import fs from "node:fs/promises";
import type { Content, Heading, Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export interface MarkdownSection {
	title: string;
	normalizedTitle: string;
	depth: number;
	headingIndex: number;
	nodes: Content[];
}

export interface ValidationIssue {
	severity: "error" | "warning";
	message: string;
}

export interface ChecklistStats {
	total: number;
	checked: number;
	unchecked: number;
}

export async function parseMarkdownFile(path: string): Promise<Root> {
	const markdown = await fs.readFile(path, "utf8");

	return unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
}

export function normalizeHeading(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[`:*_~]/g, "")
		.replace(/\s+/g, " ");
}

export function getSections(tree: Root): MarkdownSection[] {
	const sections: MarkdownSection[] = [];

	for (let i = 0; i < tree.children.length; i++) {
		const node = tree.children[i];

		if (node.type !== "heading") {
			continue;
		}

		const heading = node as Heading;
		const title = mdastToString(heading).trim();

		const nodes: Content[] = [];

		for (let j = i + 1; j < tree.children.length; j++) {
			const candidate = tree.children[j];

			if (candidate.type === "heading" && candidate.depth <= heading.depth) {
				break;
			}

			nodes.push(candidate);
		}

		sections.push({
			title,
			normalizedTitle: normalizeHeading(title),
			depth: heading.depth,
			headingIndex: i,
			nodes,
		});
	}

	return sections;
}

export function findSection(
	sections: MarkdownSection[],
	names: string | string[],
): MarkdownSection | undefined {
	const accepted = (Array.isArray(names) ? names : [names]).map(
		normalizeHeading,
	);

	return sections.find((section) => accepted.includes(section.normalizedTitle));
}

export function hasSection(
	sections: MarkdownSection[],
	names: string | string[],
): boolean {
	return findSection(sections, names) !== undefined;
}

export function sectionText(section: MarkdownSection): string {
	return section.nodes
		.map((node) => mdastToString(node))
		.join("\n")
		.trim();
}

export function sectionHasContent(section: MarkdownSection): boolean {
	return sectionText(section).length > 0;
}

export function sectionHasTable(section: MarkdownSection): boolean {
	return section.nodes.some((node) => node.type === "table");
}

export function sectionHasList(section: MarkdownSection): boolean {
	return section.nodes.some((node) => node.type === "list");
}

export function countChecklistItems(
	nodes: Content[] | Root["children"],
): ChecklistStats {
	let total = 0;
	let checked = 0;

	const visit = (node: Content): void => {
		if (node.type === "listItem" && typeof node.checked === "boolean") {
			total++;

			if (node.checked) {
				checked++;
			}
		}

		if ("children" in node) {
			for (const child of node.children) {
				visit(child);
			}
		}
	};

	for (const node of nodes) {
		visit(node);
	}

	return {
		total,
		checked,
		unchecked: total - checked,
	};
}

export function countListItems(nodes: Content[] | Root["children"]): number {
	let total = 0;

	const visit = (node: Content): void => {
		if (node.type === "listItem") {
			total++;
		}

		if ("children" in node) {
			for (const child of node.children) {
				visit(child);
			}
		}
	};

	for (const node of nodes) {
		visit(node);
	}

	return total;
}

export function getChildSections(
	allSections: MarkdownSection[],
	parent: MarkdownSection,
): MarkdownSection[] {
	return allSections.filter((section) => {
		if (section.headingIndex <= parent.headingIndex) {
			return false;
		}

		if (section.depth !== parent.depth + 1) {
			return false;
		}

		const nextPeer = allSections.find(
			(candidate) =>
				candidate.headingIndex > parent.headingIndex &&
				candidate.depth <= parent.depth,
		);

		if (nextPeer && section.headingIndex >= nextPeer.headingIndex) {
			return false;
		}

		return true;
	});
}

export function printIssues(issues: ValidationIssue[]): void {
	for (const issue of issues) {
		const prefix = issue.severity === "error" ? "✗" : "⚠";

		console.log(`${prefix} ${issue.message}`);
	}
}

export function hasErrors(issues: ValidationIssue[]): boolean {
	return issues.some((issue) => issue.severity === "error");
}

export function error(message: string): ValidationIssue {
	return {
		severity: "error",
		message,
	};
}

export function warning(message: string): ValidationIssue {
	return {
		severity: "warning",
		message,
	};
}
