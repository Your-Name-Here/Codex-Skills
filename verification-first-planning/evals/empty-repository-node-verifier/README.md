# Empty-repository Node verifier eval

This eval checks a post-planning workspace for a URL-shortener handoff. It verifies mechanically discoverable artifacts and runs the documented Node verifier command. It does not assess whether the requirements are complete or whether every test assertion is semantically correct.

Run it with:

```sh
node evals/empty-repository-node-verifier/verify.mjs <post-skill-workspace>
```

Exit codes: `0` means passed, `1` means a skill outcome failed an invariant, and `2` means invocation or eval setup is invalid. The evaluator uses Node built-ins only.

The eval checks for a specification, task list, verification matrix, baseline, executable Node verifier, documented runnable command, execution evidence, contract-focused HTTP checks, missing-implementation failure evidence, and no obvious URL-shortener implementation outside planning/verifier artifacts. Its implementation scan is intentionally heuristic; a human should review borderline files and semantic requirement quality.

See [prompt.md](prompt.md) for the scenario given to the planning skill.

Run evaluator self-tests with:

```sh
node evals/empty-repository-node-verifier/self-test.mjs
```

The self-test creates temporary compliant, prose-only, and improperly implemented workspaces, then checks the corresponding outcomes and invalid invocation exit codes.
