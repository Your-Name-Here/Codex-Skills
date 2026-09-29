# Feature or project: [short name]

## Goal
[Who needs what outcome, stated in observable terms.]

## Observable End State
[Describe the state a user or system can observe when the work is complete.]

## Behavioral contract

### Success modes
- [Important successful path and observable result]

### Failure modes
- [Relevant invalid, denied, unavailable, or partial-failure path and result]

### Invariants
- [What must remain true or continue working]

## Acceptance criteria
- [ ] **AC-1:** [Observable pass/fail condition]

## Verification Matrix

| Requirement | Scenario and expected result | Evidence / verification | Setup or environment |
| --- | --- | --- | --- |
| [AC-1 / invariant] | [Input or state -> observable result] | [Test path and type, or human procedure] | [Data/dependency] |

## Baseline Results

| Check or command | Scope | Result | Evidence / notes |
| --- | --- | --- | --- |
| [Existing check] | [Coverage] | [Pass / pre-existing failure / unable to run] | [Concise evidence] |
| [New verifier] | [Verification matrix IDs] | [Expected missing-behavior failure / pass / setup defect / unable to run] | [Failing assertion or blocker] |

## Human Verification
- [Procedure and expected observable outcome, or "None required" with a reason]

## Material implementation constraints
[Include affected public APIs, persistence, data flow, external integrations, compatibility boundaries, migration concerns, or operational impacts only when they affect implementation or verification.]

## Assumptions and open decisions
- **Assumption:** [Non-blocking uncertainty and impact]
- **Blocking decision:** [Question that must be resolved before implementation-ready; omit if none]

## Scope boundaries
- In scope: [Requested behavior]
- Out of scope: [Only boundaries needed to prevent likely scope drift]
