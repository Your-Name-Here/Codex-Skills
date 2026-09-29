# Integration tests

Use integration tests when correctness depends on collaboration between real components, such as application services and a database, an API and its authentication layer, or a queue producer and consumer.

- Exercise the meaningful boundary and contract between components.
- Use realistic serialization, persistence, configuration, or protocol behavior where those are part of the risk.
- Isolate test data and clean up state so results remain repeatable.
- Avoid rebuilding the entire production environment when a smaller representative boundary provides sufficient evidence.

State what is real and what is substituted in the test setup. Use integration coverage where unit tests would miss wiring or contract failures; do not repeat checks already covered more clearly at another level.
