# Verification artifacts

Create the verifier before product implementation whenever practical. Use the project's existing test framework, layout, fixtures, and commands. Verification artifacts may include tests, fixtures, test data, test-only harnesses, and test-only configuration or scripts.

## Keep the boundary clear

- A test may invoke the product, arrange controlled inputs, and inspect observable results. It must not supply the missing product behavior itself.
- Keep helpers and fakes limited to setup or controlled dependency boundaries; do not duplicate the feature's intended logic in the harness.
- Prefer a small set of checks tied to acceptance criteria, failure modes, invariants, and preserved behavior over a large generic suite.
- Do not modify product implementation as part of planning. If verification appears to require a production-code change, record that dependency for implementation rather than making it.

## Write before implementation

Use executable tests when the current test infrastructure can express the contract without disproportionate setup. New tests may initially fail because the requested behavior does not exist. Validate that such a failure is caused by the missing expected behavior, not by a broken test, fixture, runner, or environment. Correct verification defects before recording the baseline.

If a runnable test is not practical, preserve the same contract in the verification matrix and specify the manual steps, inputs, and expected results. If test infrastructure must be added, keep the addition test-only and proportionate; state it as a prerequisite when the work is too large or risky to establish during planning.
