# Unit tests

Use unit tests for focused logic with clear inputs and outputs, such as parsing, validation, calculations, state transitions, and edge-case handling.

- Test externally meaningful behavior of the unit, not private call sequences or incidental implementation details.
- Cover representative valid, invalid, boundary, and error cases that matter to the requirement.
- Keep dependencies controlled when isolation makes the result clearer; avoid elaborate mocks that duplicate the implementation.
- Prefer a small number of discriminating examples over many near-duplicates.

Unit tests do not establish that separately correct components are wired together, nor do they prove a complete user journey. Pair them with broader checks when the feature crosses those boundaries.
