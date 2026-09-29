# Smoke tests

Use smoke tests as a short post-build or post-deployment check that the essential system path is available. They should detect gross failures quickly, not replace detailed correctness checks.

- Select only critical startup, health, or user-facing paths.
- Keep the check fast and robust in the target environment.
- State where it runs and what constitutes a healthy result.
- Do not use a passing smoke test as evidence that edge cases or full acceptance criteria are satisfied.
