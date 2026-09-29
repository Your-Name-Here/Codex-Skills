# Verification artifacts

Create the verifier before product implementation whenever practical. Use the project's existing test framework, layout, fixtures, and commands when they exist. Verification artifacts may include tests, fixtures, test data, test-only harnesses, and test-only configuration or scripts.

Separate the planning-owned contract verifier from implementation-owned tests. Run the acceptance verifier for the product baseline and seal its executable artifacts with a SHA-256 manifest before handoff. See [Verifier ownership and integrity](verifier-integrity.md) for the manifest and checker.

## Keep the boundary clear

- A test may invoke the product, arrange controlled inputs, and inspect observable results. It must not supply the missing product behavior itself.
- Keep helpers and fakes limited to setup or controlled dependency boundaries; do not duplicate the feature's intended logic in the harness.
- Prefer a small set of checks tied to acceptance criteria, failure modes, invariants, and preserved behavior over a large generic suite.
- Do not modify product implementation as part of planning. If verification appears to require a production-code change, record that dependency for implementation rather than making it.

## Write before implementation

Inspect available runtimes and tools before deciding whether executable verification is practical. The absence of an application scaffold, package manifest, or test runner is not sufficient reason to fall back to prose-only verification. When a stable observable boundary can express the contract, create a minimal self-contained verifier that uses available tools and imposes no internal architecture. For Node.js, prefer built-ins (`node:test`, `node:assert`, `fetch`, child-process and temporary filesystem utilities); do not add a framework dependency solely to enable pre-implementation checks.

New tests may fail before implementation, but first validate the verifier and setup independently. A baseline is an expected missing-behavior failure only when its evidence points to the absent feature, such as connection refused, an unimplemented route returning 404, or an absent executable entrypoint explicitly classified as missing implementation. Syntax errors, bad fixtures, invalid paths/commands, verifier-only missing dependencies, environment errors, and assumptions that contradict the contract are setup defects to fix, not acceptable baselines. If the contract's boundary is an external service, target a configurable endpoint such as `BASE_URL`; if the harness can safely launch and restart a local app, use process utilities without prescribing its internal design.

Defer executable verification only when creating the verifier would itself require implementing product behavior or prematurely constrain a material unresolved contract, or when a concrete runtime/environment/safety limitation prevents it. State that specific reason, preserve the same contract in the matrix, and specify manual steps, inputs, and expected results. If test infrastructure must be added, keep it test-only and proportionate; do not treat lack of an existing runner as a blocker when built-in tooling can suffice.
