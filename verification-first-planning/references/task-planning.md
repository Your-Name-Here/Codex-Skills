# Implementation task planning

Create the implementation task list after the verification artifacts and baseline. It is a handoff for a later implementation agent, not permission to implement the feature during planning.

- Order tasks around outcomes, prerequisites, and dependencies rather than arbitrary file counts.
- Give each task a clear result, completion evidence, and links to relevant acceptance criteria and verification artifacts.
- Leave safe internal design choices to the implementation agent. Include constraints or interfaces only when the contract requires them.
- Include applicable persistence, migration, data preservation, external integration, compatibility, rollout, monitoring, rollback, and recovery work when the feature affects those areas. Do not add operational tasks that do not apply.
- Do not list test or harness creation as future work when those artifacts were already created during planning. Include post-implementation execution of the planned verifier and any required human checks.
- Surface unresolved blocking decisions as blockers; do not disguise them as implementation tasks. Keep non-blocking assumptions explicit in the handoff.

Keep tasks granular enough to review and sequence, but avoid artificial microtasks. The final task should leave implementation reviewable and report post-implementation verification results.
