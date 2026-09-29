# Baseline results

The baseline describes the repository before feature implementation, after the planned verifier has been added. It tells the implementation agent which failures are pre-existing and which new failures are the expected evidence of missing behavior.

## Run safely

Inspect test commands, configuration, environment targets, and setup scripts before executing them. Use local or isolated test data. Do not run against production or shared state. If a check can cause destructive or externally mutating effects, get authorization before running it; otherwise record it as unable to run.

Run the new verification artifacts and relevant existing checks. Include a broader existing suite when practical and useful; if it is not run, state the scope and reason. Record exact commands or invocation, relevant environment/commit context when available, and concise outcomes. Do not include secrets.

## Classify outcomes

- **Existing checks passing:** Record the checked area and result as evidence of behavior already working.
- **Pre-existing failures:** Record the failure and evidence that it is unrelated to the new verifier where possible. Do not silently fold it into expected feature failures.
- **New verifier failing as expected:** Record the failing assertion and evidence that the failure is caused by absent product behavior (for example, connection refused because no service exists, a contract route returns 404, or a missing entrypoint explicitly represents unimplemented behavior). First rule out a defective test, fixture, command/path, dependency, environment, or contract assumption. A generic nonzero exit is not enough to call the baseline expected.
- **Verifier/setup defect:** Record and fix syntax errors, invalid fixture construction, incorrect command paths, dependencies introduced only by the verifier, or assumptions that conflict with the contract. Re-run the verifier after the fix; do not hand off such failures as expected missing behavior.
- **Unable to execute:** State the blocker, such as unavailable service, credentials, platform, or unsafe target. Do not report an unrun check as passed or failed.
- **Human verification:** State who or what environment is needed, concrete steps, and expected outcome.

If an outcome cannot be classified confidently, label it unresolved and state what evidence is missing. The baseline is a snapshot, not a claim that the feature is complete. Lack of an existing test runner is not itself an unable-to-execute result when available built-in tooling can run a self-contained verifier.
