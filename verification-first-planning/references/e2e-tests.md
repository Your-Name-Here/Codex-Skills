# End-to-end tests

Use end-to-end tests for a small set of critical user journeys whose correctness depends on the application working across its major layers.

- Begin from a user-visible entry point and assert meaningful outcomes, not internal implementation details.
- Select high-value paths, including a failure or alternate path when important.
- Keep setup and data deterministic; avoid dependence on unrelated external services unless that dependency is itself under test.
- Avoid using end-to-end coverage for every small rule when a faster focused check gives stronger diagnostics.

Record the journey, required environment, and expected outcome. Plan a smaller targeted alternative when the full environment is unavailable or the journey is too unstable to automate reliably.
