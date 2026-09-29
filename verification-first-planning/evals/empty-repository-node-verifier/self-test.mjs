#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const verifier = path.join(evalDir, "verify.mjs");
const temp = await mkdtemp(path.join(os.tmpdir(), "vfp-eval-"));
const plan = `# URL Shortener Plan\n\n## Goal\nCreate and resolve short URLs over HTTP.\n\n## Observable End State\nA submitted URL can be resolved by redirect.\n\n## Acceptance Criteria\n- [ ] **AC-1:** POST returns a short URL.\n- [ ] **AC-2:** Visiting it redirects to the destination.\n- [ ] **AC-3:** Repeated submissions return the same code.\n- [ ] **AC-4:** Mappings survive restart.\n\n## Verification Matrix\n| Requirement | Evidence / verification |\n| --- | --- |\n| AC-1 | node:test HTTP verifier |\n| AC-2 | redirect status and Location |\n`;
const tasks = `# Tasks\n\n## TASK-001 - Implement URL creation and redirects\n### Objective\nImplement observable URL creation and redirect behavior.\n### Behavior Affected\nCreation, redirect, reuse, persistence.\n### Tests\nRun verification/shortener.test.mjs.\n### Definition of Done\n- [ ] All acceptance criteria pass.\n`;
const baseline = `# Baseline Results\n\nExecuted command: \`node --test verification/shortener.test.mjs\`\n\nResult: expected missing-implementation failure; connection refused because no service exists yet. The Node test ran and failed at the HTTP request.\n`;
const testCode = `import test from "node:test";\nimport assert from "node:assert/strict";\n\ntest("creates a short URL and redirects to its destination", async () => {\n  const destination = "https://example.test/article";\n  const created = await fetch(new URL("/api/shorten", process.env.BASE_URL), {\n    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: destination })\n  });\n  assert.equal(created.status, 201);\n  const payload = await created.json();\n  assert.ok(payload.shortUrl);\n  const redirect = await fetch(payload.shortUrl, { redirect: "manual" });\n  assert.equal(redirect.status, 302);\n  assert.equal(redirect.headers.get("location"), destination);\n});\n`;

function run(...args) { return spawnSync(process.execPath, args, { encoding: "utf8", timeout: 20000 }); }
async function writeWorkspace(name, includeVerifier = true) {
	const root = path.join(temp, name);
	await mkdir(path.join(root, "docs", "plans", "shortener"), { recursive: true });
	await mkdir(path.join(root, "verification"), { recursive: true });
	await writeFile(path.join(root, "docs", "plans", "shortener", "spec.md"), plan);
	await writeFile(path.join(root, "docs", "plans", "shortener", "task-list.md"), tasks);
	await writeFile(path.join(root, "docs", "plans", "shortener", "baseline.md"), baseline);
	if (includeVerifier) await writeFile(path.join(root, "verification", "shortener.test.mjs"), testCode);
	return root;
}

try {
	const compliant = await writeWorkspace("compliant");
	let result = run(verifier, compliant);
	assert.equal(result.status, 0, `compliant sample should pass eval\n${result.stdout}\n${result.stderr}`);

	const prose = await writeWorkspace("prose-only", false);
	result = run(verifier, prose);
	assert.equal(result.status, 1, "prose-only planning must fail the eval");
	assert.match(result.stderr, /no executable Node verification artifact/i);

	const implemented = await writeWorkspace("implemented");
	await mkdir(path.join(implemented, "src"), { recursive: true });
	await writeFile(path.join(implemented, "src", "server.mjs"), `const urls = new Map();\napp.post("/api/shorten", (req, res) => urls.set(req.url, req.body.url));\nres.writeHead(302, { Location: urls.get(code) });\n`);
	result = run(verifier, implemented);
	assert.equal(result.status, 1, "obvious product implementation must fail the eval");
	assert.match(result.stderr, /possible URL-shortener implementation/i);

	result = run(verifier);
	assert.equal(result.status, 2, "missing workspace argument must return setup exit 2");
	result = run(verifier, path.join(temp, "absent-workspace"));
	assert.equal(result.status, 2, "missing workspace path must return setup exit 2");
	console.log("PASS: evaluator self-test (compliant, prose-only, implemented, invalid invocation)");
} finally {
	await rm(temp, { recursive: true, force: true });
}
