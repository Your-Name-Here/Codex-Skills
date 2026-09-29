# Property and invariant tests

Use property-based or invariant-oriented checks when a rule should hold across many generated inputs, states, or operation sequences, and examples alone are unlikely to cover the relevant space.

Examples of useful properties include round-trip transformations, conservation of totals, ordering constraints, idempotency, state-machine rules, and consistency between related views of the same data.

- State the property in domain terms and define valid input assumptions.
- Bound generators to meaningful states and include useful edge values.
- Keep failing cases reproducible through the project's shrinking or seed reporting support.
- Use example-based tests alongside a property when they make specific requirements easier to understand.

Do not introduce property-testing infrastructure for a simple finite rule that a few clear examples already cover.
