# Implementation Guidance

This guidance applies after a verification-first planning handoff has been completed and sealed.

## 1. Read the handoff first

Before implementing:

- read the feature/project specification;
- read the verification matrix;
- read the baseline report;
- read the task list;
- inspect the sealed acceptance verifier;
- verify contract integrity.

Do not begin implementation if the sealed contract is already invalid.

## 2. Respect verifier ownership

Planning-owned acceptance verification defines the target.

Do not:

- modify sealed verifier files;
- regenerate the manifest;
- weaken assertions;
- skip required verification;
- replace acceptance checks with implementation-owned tests.

If the sealed contract appears incorrect, incomplete, contradictory, or impossible to satisfy, propose a contract change instead.

## 3. Add implementation-owned verification

The sealed acceptance verifier is the minimum externally observable contract. It is not necessarily sufficient to prove the implementation is robust.

After choosing the implementation architecture, identify risks introduced by that architecture and add tests that provide distinct confidence.

Consider, where applicable:

- unit tests;
- integration tests;
- end-to-end tests;
- property/invariant tests;
- regression tests;
- smoke tests.

Do not add tests merely to satisfy a category checklist.

## 4. Test implementation-specific risks

Look for risks the planning phase could not know before implementation existed.

Examples:

- transaction boundaries;
- concurrency and races;
- persistence behavior;
- retry behavior;
- malformed inputs;
- partial failures;
- resource cleanup;
- process lifecycle;
- serialization/parsing;
- algorithmic edge cases;
- uniqueness constraints;
- external dependency failures;
- migration behavior.

Add tests where these risks are meaningful.

## 5. Test both success and failure behavior

For meaningful implementation paths, consider:

- expected success;
- rejected input;
- dependency failure;
- partial failure;
- repeated operation;
- concurrent operation;
- recovery after failure.

Failure tests should verify state as well as response behavior when state mutation is possible.

For example, do not merely assert that a failed database write returns an error. Verify that no partial or corrupt state remains.

## 6. Prefer real boundaries where practical

Prefer real integrations when they provide materially stronger evidence.

Examples:

- real SQLite database instead of a mocked repository;
- real HTTP server instead of directly invoking route functions;
- real filesystem using temporary directories;
- real process restart when persistence across restart matters.

Use mocks when the real dependency is impractical, unsafe, nondeterministic, or would make the test excessively expensive.

## 7. Preserve the distinction between acceptance and implementation tests

Planning-owned acceptance tests answer:

> Does the product satisfy the agreed behavioral contract?

Implementation-owned tests answer:

> Is this particular implementation reliable?

Implementation-owned tests may evolve freely as the implementation evolves.

They must not redefine the acceptance contract.

## 8. Work task-by-task

For each implementation task:

1. identify the acceptance criteria it contributes to;
2. identify implementation-specific risks;
3. implement the smallest coherent change;
4. add or update implementation-owned tests;
5. run the relevant focused checks;
6. run affected regression checks;
7. continue only when the task's definition of done is satisfied.

## 9. Final verification

Before declaring implementation complete:

- verify sealed contract integrity;
- run the sealed acceptance verifier;
- run implementation-owned tests;
- run static checks such as typechecking/linting where applicable;
- run smoke verification where applicable;
- complete required human verification;
- confirm all applicable task definitions of done.

Do not report completion if required verification is skipped, blocked, or failing.

## 10. Contract changes

Implementation agents may propose contract changes but may not approve them.

A proposed change should state:

- what is wrong with the current contract;
- which requirement or assumption is affected;
- which sealed artifacts would need to change;
- whether observable product behavior changes;
- why implementation cannot reasonably continue under the current contract.

Implementation resumes only after an authorized planning/review phase updates the contract, reruns the baseline, and reseals the verifier.