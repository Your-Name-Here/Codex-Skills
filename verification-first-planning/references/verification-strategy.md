# Verification strategy

Design verification from the observable contract, not from an assumed test pyramid. Cover important success paths, failure paths, invariants, and preserved behavior. For each criterion, identify evidence that can show it holds and avoid redundant checks that add no distinct confidence.

For each row in the verification matrix, record:

- the behavior, failure mode, invariant, or preserved behavior;
- the scenario and expected observable result;
- the check type and artifact that will verify it;
- required setup, data, and environment;
- whether it is automated or requires a person.

Prefer the narrowest check that credibly covers a behavior, then add broader checks for component boundaries, critical journeys, deployment health, or generated input/state spaces when those catch distinct risks. Reuse the repository's established test tools and conventions when suitable. If none exist, inspect available runtime/tooling and use a minimal built-in harness when it can test a stable boundary. An empty or minimally initialized repository can still support meaningful executable verification; for a Node.js service, a dependency-free `node:test` file can target a configurable HTTP endpoint and assert status, response shape, redirects, idempotence, and persistence across a process restart when the harness can safely start the app. Such checks must remain independent of internal implementation choices. Read the relevant method guide for test-type-specific advice.

When no repository is available at all, define verification intent without fabricating paths, commands, or infrastructure, and mark project-specific conventions unknown. When a repository exists but lacks a test setup, do not equate that with no repository: inspect the installed runtime and create a proportionate self-contained harness where practical. For checks that cannot yet be automated, state the concrete limitation (such as a required unavailable runtime, unsafe shared target, unresolved contract, or verifier requiring product behavior) and give a human-verification procedure.
