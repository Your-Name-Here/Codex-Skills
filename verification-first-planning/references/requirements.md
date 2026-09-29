# Observable contract

Describe the requested end state in terms a user or dependent system can observe. Keep the contract small enough to verify and precise enough that an implementation agent does not have to guess at material behavior.

## Capture when relevant

- **Goal and end state:** Who needs what outcome?
- **Success modes:** What important successful paths produce the intended result?
- **Failure modes:** What happens for invalid input, denied access, unavailable dependencies, or partial failure when those affect the contract?
- **Invariants:** What must remain true across operations, states, or data transitions?
- **Preserved behavior:** Which existing behavior, interfaces, or compatibility expectations must continue to work?
- **Constraints and boundaries:** Relevant security, privacy, accessibility, performance, platform, persistence, compatibility, and scope requirements.
- **Implementation-shaping details:** Affected public APIs, data flow, persistence, external integrations, and migration concerns only when they materially affect implementation or verification.
- **Open decisions:** Separate material questions from non-blocking assumptions.

State criteria so a verifier can distinguish pass from fail through observable outcomes. Use representative examples for complicated cases; use a rule or invariant instead of enumerating many examples when that is clearer.

## Clarification threshold

Resolve ambiguity before calling the handoff implementation-ready if plausible interpretations would change observable behavior, persistence, security, compatibility, destructive effects, or the verification strategy. Ask the user about such a blocking question. Do not block on internal design choices the implementation agent can safely make while preserving the contract. Record other uncertainty as an explicit assumption and note its impact when useful.

Do not infer requirements from a code pattern alone or turn every sentence in a request into a separate criterion. Preserve stated priorities and avoid adding unrequested behavior.

## Delegated implementation choices

When the user explicitly leaves a behavior to implementation and the choice does not materially change the observable contract, record it as an implementation choice and leave it open. Do not add a preferred or recommended default just because one seems conventional. Recommend or constrain a choice only to satisfy an explicit requirement, security or safety constraint, compatibility, a verified repository convention, or another documented contract constraint; record that reason.
