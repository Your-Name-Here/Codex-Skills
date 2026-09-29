# Regression tests

Regression verification protects established behavior affected by the change. Identify likely impact areas from code ownership, dependencies, shared interfaces, data flows, and prior defects.

- Add or update a focused check for a previously broken behavior when it is practical and valuable.
- Select existing checks based on the change's impact area; do not equate regression coverage with running every test in all situations.
- Include compatibility, migration, or data-preservation checks when the feature changes those contracts.
- Make the expected unchanged behavior explicit when it is important to users.

Distinguish a new-feature acceptance check from a regression check when that distinction clarifies coverage. One scenario may serve both purposes if stated clearly.
