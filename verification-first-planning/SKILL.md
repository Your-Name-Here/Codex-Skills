---
name: verification-first-planning
description: Create verification-first implementation handoffs for software projects and features by defining observable behavior, preparing and baselining checks before implementation where practical, and producing a traceable task plan. Use for feature or project planning, not implementation-only requests.
metadata:
  short-description: Create a verified implementation handoff
---

# Verification-First Implementation Handoff

This skill prepares a later implementation agent to work toward a concrete verifier. Planning includes creating verification artifacts and recording their current results; it does not include implementing product behavior.

## Workflow

1. Understand the request and inspect the repository, conventions, behavior, and verification setup before designing checks or implementation tasks. If no repository is available, plan from the prompt and mark repository-specific facts as unknown; never invent project structure.
2. Define the observable end state, success modes, failure modes, invariants, and existing behavior that must be preserved. Record implementation-shaping details only when they materially affect behavior or verification.
3. Resolve ambiguities that materially change observable behavior, persistence, security, compatibility, destructive effects, or verification. Ask about blocking questions before calling the handoff implementation-ready. Record non-blocking uncertainty as explicit assumptions; leave safe implementation choices to the implementation agent.
4. Design a verification strategy and map each acceptance criterion, important failure mode, invariant, and preserved behavior to concrete evidence. Select test types for distinct coverage rather than following a fixed test pyramid.
5. Create executable verification before implementation whenever practical. An empty repository or absent test runner alone is not a reason to omit it. Do not implement product behavior during planning. If executable verification must be deferred, document the specific reason. See [Verification artifacts](references/verification-artifacts.md).
6. Run the planning-owned contract verifier safely and record a real product baseline, distinguishing missing behavior from verifier/setup defects. Never claim a check ran or passed without evidence. See [Baseline results](references/baseline-results.md).
7. After the baseline, create a SHA-256 integrity manifest for the planning-owned contract verifier artifacts. Record the manifest path and integrity-check command in the handoff. See [Verifier ownership and integrity](references/verifier-integrity.md).
8. Create the granular implementation task plan after the baseline and seal. Order tasks by dependencies and outcomes, link them to criteria and verifiers, and include post-implementation verification. The task list is a handoff for future work; stop before implementing product behavior unless explicitly instructed otherwise.
9. Run the planning-document validators. Validate the feature specification/plan and task list separately or run the combined command; resolve errors and review warnings before handing off. These scripts check Markdown structure and completeness, not whether requirements are correct or checks actually ran.
10. Save durable artifacts in the project's established planning location. If none exists, use `docs/plans/<feature-slug>/`. Summarize created artifacts, baseline results, validator results, unknowns, and blocking issues in chat. If no repository is available, provide the handoff in the requested format and explicitly mark unknown project facts.

## Planning artifact validation

The skill includes dependency-free Node.js scripts that inspect plan and task-list Markdown. Node.js is the only runtime requirement. Run:

```sh
node scripts/validate-plan.mjs docs/plans/<feature-slug>/plan.md
node scripts/validate-task-list.mjs docs/plans/<feature-slug>/task-list.md
```

To run both checks together:

```sh
node scripts/combined-validate.mjs docs/plans/<feature-slug>/plan.md docs/plans/<feature-slug>/task-list.md
```

Exit code `0` means no validation errors; warnings may still need human review. Exit code `1` means one or more structural errors were found. Exit code `2` means the command arguments or input file are unavailable. The validators recognize the Markdown structures used by these planning templates: headings, paragraphs, lists, task checkboxes, and GFM-style tables. If your project does not use this skill repository's tooling, adapt the command paths to the installed copy of the skill or validate the artifact manually.

## Boundaries

- Planning may create or update feature specifications, verification matrices, tests, fixtures, test data, test harnesses, test-only configuration, baseline reports, and task lists. It must not implement product behavior.
- Planning-owned contract verifiers are the acceptance target: create them before implementation where practical, baseline them before implementation, then seal them with the SHA-256 manifest. Implementation agents may identify and propose contract changes, but only the user or an explicitly authorized planning/review phase may approve them. After approval, update the behavioral specification as needed, rerun the affected product baseline, and create a new manifest revision before implementation continues.
- Implementation-owned unit, internal integration, regression, debugging tests, and implementation-specific fixtures may be added or changed freely. They do not replace or redefine the sealed planning-owned contract verifier.
- Before running checks, inspect their target and side effects. Do not run checks against production or shared state; if execution could be destructive or externally mutating, obtain authorization or record that verification cannot yet run.
- Keep requirements, assumptions, verification evidence, and implementation suggestions distinct. When the user explicitly delegates a behavior as an implementation choice and it does not materially affect the observable contract, record it as such and leave it open. Do not add a recommended default unless an explicit requirement, security/safety constraint, compatibility need, verified repository convention, or other documented contract constraint requires one.
- Adapt the templates to the request. A small feature can have a compact handoff, but retain the verifier and baseline evidence when practical.

## Implimentation Guidance

The implementation handoff must direct the implementation agent to read
`references/Implementation-Guidance.md` before beginning implementation.

## References

- [Requirements](references/requirements.md) for defining the observable contract and material questions.
- [Verification strategy](references/verification-strategy.md) for mapping behavior to evidence and selecting check types.
- [Verification artifacts](references/verification-artifacts.md) for writing tests and test-only support before implementation.
- [Baseline results](references/baseline-results.md) for running checks safely and reporting outcomes.
- [Verifier ownership and integrity](references/verifier-integrity.md) for separating planning-owned acceptance checks from implementation-owned tests and sealing the contract verifier.
- [Task planning](references/task-planning.md) for the implementation handoff after baseline.
- Read the relevant method guide when selecting [unit](references/unit-tests.md), [integration](references/integration-tests.md), [end-to-end](references/e2e-tests.md), [regression](references/regression-tests.md), [smoke](references/smoke-tests.md), or [property and invariant](references/property-and-invariant-tests.md) checks.
- Use the [feature specification](templates/feature-spec.md), [verification matrix](templates/verification-matrix.md), [baseline report](templates/baseline-report.md), and [task list](templates/task-list.md) templates as appropriate.
