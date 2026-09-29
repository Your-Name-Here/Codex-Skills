# Verification strategy

Design verification from the observable contract, not from an assumed test pyramid. Cover important success paths, failure paths, invariants, and preserved behavior. For each criterion, identify evidence that can show it holds and avoid redundant checks that add no distinct confidence.

For each row in the verification matrix, record:

- the behavior, failure mode, invariant, or preserved behavior;
- the scenario and expected observable result;
- the check type and artifact that will verify it;
- required setup, data, and environment;
- whether it is automated or requires a person.

Prefer the narrowest check that credibly covers a behavior, then add broader checks for component boundaries, critical journeys, deployment health, or generated input/state spaces when those catch distinct risks. Reuse the repository's established test tools and conventions when suitable. Read the relevant method guide for test-type-specific advice.

When no repository or test setup is available, define the verification intent without fabricating paths, commands, or infrastructure. Mark project-specific conventions and feasibility as unknown until the implementation repository is available. For checks that cannot yet be automated, record the reason and a concrete human-verification procedure.
