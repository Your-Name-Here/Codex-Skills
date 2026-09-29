# Verification baseline: [feature or project]

## Context
- Repository / commit: [when available]
- Environment: [relevant runtime, configuration, or test target; omit secrets]
- Baseline captured: [date]

## Results

| Check or command | Scope | Result | Evidence / notes |
| --- | --- | --- | --- |
| [Existing check] | [Coverage] | [Pass / pre-existing failure / unable to run] | [Concise evidence] |
| [New verifier] | [Verification matrix IDs] | [Expected missing-behavior failure / pass / setup defect / unable to run] | [Failing assertion or blocker] |

## Human verification
- Procedure: [Steps]
- Required person or environment: [Who/where]
- Expected result: [Observable outcome]

## Known pre-existing failures and limits
- [Failure, unrun scope, or limitation, with reason]

Do not mark checks as passed unless they were actually run. Distinguish expected missing-feature failures from test or environment defects.

## Contract verifier integrity
- Planning-owned verifier artifacts sealed: [workspace-relative paths]
- Integrity manifest: [workspace-relative path]
- Integrity check: `[exact runnable command]`

The product baseline records product verification only. Record the skill evaluator's result outside this project baseline. Implementation-owned tests are not included in the integrity manifest unless they were intentionally created as part of the planning-owned acceptance verifier.

Implementation agents may propose contract changes but cannot approve them. Record the user or explicitly authorized planning/review phase that approved any change, then update the specification, rerun the affected baseline, and advance the manifest revision before implementation resumes.
