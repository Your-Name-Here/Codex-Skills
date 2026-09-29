import { readFile } from "node:fs/promises";

// This intentionally handles the Markdown structures used by the planning
// validators without requiring a parser package.
export async function parseMarkdownFile(filePath) {
	return parseMarkdown(await readFile(filePath, "utf8"));
}

export function parseMarkdown(markdown) {
	const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
	const children = [];
	let paragraph = [];
	let list = null;
	let fenced = false;
	let fenceMarker = "";

	const flushParagraph = () => {
		if (paragraph.length) {
			children.push({ type: "paragraph", text: paragraph.join(" ").trim() });
			paragraph = [];
		}
	};
	const flushList = () => {
		if (list) children.push(list);
		list = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fence = line.match(/^\s{0,3}(```+|~~~+)/);
		if (fenced) {
			if (fence && fence[1][0] === fenceMarker[0] && fence[1].length >= fenceMarker.length) fenced = false;
			continue;
		}
		if (fence) {
			flushParagraph(); flushList(); fenced = true; fenceMarker = fence[1]; continue;
		}
		const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
		if (heading) {
			flushParagraph(); flushList();
			children.push({ type: "heading", depth: heading[1].length, text: heading[2].trim() });
			continue;
		}
		if (/^\s{0,3}(?:[-*_]\s*){3,}$/.test(line)) { flushParagraph(); flushList(); continue; }
		const tableLine = line.trim().startsWith("|") && line.trim().endsWith("|");
		const nextIsTableDivider = tableLine && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1]);
		if (nextIsTableDivider) {
			flushParagraph(); flushList();
			const table = { type: "table", rows: [line] };
			i++;
			while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) table.rows.push(lines[++i]);
			children.push(table); continue;
		}
		const item = line.match(/^\s*(?:[-+*]|\d+[.)])\s+(.*)$/);
		if (item) {
			flushParagraph();
			if (!list) list = { type: "list", items: [] };
			const check = item[1].match(/^\[([ xX])\]\s*(.*)$/);
			list.items.push({ type: "listItem", checked: check ? check[1].toLowerCase() === "x" : undefined, text: check ? check[2] : item[1] });
			continue;
		}
		if (!line.trim()) { flushParagraph(); flushList(); continue; }
		flushList();
		paragraph.push(line.trim());
	}
	flushParagraph(); flushList();
	return { type: "root", children };
}

function inlineText(value) {
	return value
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
		.replace(/<https?:\/\/[^>]+>/g, "")
		.replace(/<[^>]*>/g, "")
		.replace(/\\([\\`*_{}\[\]()#+.!|>~-])/g, "$1")
		.replace(/[`*_~]/g, "")
		.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

export function normalizeHeading(value) {
	return inlineText(value).trim().toLowerCase().replace(/[`:*_~]/g, "").replace(/\s+/g, " ");
}

export function getSections(tree) {
	const sections = [];
	for (let i = 0; i < tree.children.length; i++) {
		const node = tree.children[i];
		if (node.type !== "heading") continue;
		const nodes = [];
		for (let j = i + 1; j < tree.children.length; j++) {
			const candidate = tree.children[j];
			if (candidate.type === "heading" && candidate.depth <= node.depth) break;
			nodes.push(candidate);
		}
		const title = inlineText(node.text).trim();
		sections.push({ title, normalizedTitle: normalizeHeading(title), depth: node.depth, headingIndex: i, nodes });
	}
	return sections;
}

export function findSection(sections, names) {
	const accepted = (Array.isArray(names) ? names : [names]).map(normalizeHeading);
	return sections.find((section) => accepted.includes(section.normalizedTitle));
}
export function hasSection(sections, names) { return findSection(sections, names) !== undefined; }
export function sectionText(section) { return section.nodes.map(nodeText).join("\n").trim(); }
function nodeText(node) {
	if (node.type === "paragraph" || node.type === "heading") return inlineText(node.text);
	if (node.type === "table") return node.rows.map((row) => inlineText(row)).join(" ");
	if (node.type === "list") return node.items.map((item) => inlineText(item.text)).join(" ");
	return "";
}
export function sectionHasContent(section) { return sectionText(section).length > 0; }
// Detect bracketed template prompts while ignoring ordinary Markdown link labels.
// This is intentionally scoped to the bracket placeholders used by this skill.
export function hasTemplatePlaceholder(value) {
	const withoutLinks = String(value).replace(/!?(\[[^\]\n]*\])(?:\([^\n)]*\)|\[[^\]\n]*\])/g, "");
	return /\[[^\]\n]{3,}\]/.test(withoutLinks);
}
export function sectionHasTemplatePlaceholder(section) { return hasTemplatePlaceholder(sectionText(section)); }
export function sectionHasTable(section) { return section.nodes.some((node) => node.type === "table"); }
export function sectionHasList(section) { return section.nodes.some((node) => node.type === "list"); }
export function countChecklistItems(nodes) {
	let total = 0, checked = 0;
	for (const node of nodes) if (node.type === "list") for (const item of node.items) if (typeof item.checked === "boolean") { total++; if (item.checked) checked++; }
	return { total, checked, unchecked: total - checked };
}
export function countListItems(nodes) { return nodes.reduce((total, node) => total + (node.type === "list" ? node.items.length : 0), 0); }
export function getChildSections(allSections, parent) {
	return allSections.filter((section) => {
		if (section.headingIndex <= parent.headingIndex || section.depth !== parent.depth + 1) return false;
		const nextPeer = allSections.find((candidate) => candidate.headingIndex > parent.headingIndex && candidate.depth <= parent.depth);
		return !nextPeer || section.headingIndex < nextPeer.headingIndex;
	});
}
export function printIssues(issues) {
	for (const issue of issues) console.log(`${issue.severity === "error" ? "✗" : "⚠"} ${issue.message}`);
}
export function hasErrors(issues) { return issues.some((issue) => issue.severity === "error"); }
export function error(message) { return { severity: "error", message }; }
export function warning(message) { return { severity: "warning", message }; }
