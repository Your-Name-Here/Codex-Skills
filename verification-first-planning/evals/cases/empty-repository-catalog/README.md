# Empty repository catalog scenario

This scenario provides a sample planning prompt and a minimal expectation that executable verification is required. It is separate from the generic evaluator, which does not inspect catalog behavior.

Run the generic evaluator with:

```sh
node evals/verify.mjs <post-planning-workspace> evals/cases/empty-repository-catalog/expectations.json
```

The scenario's behavior coverage and semantic quality are for human review.

Prompt: [prompt.md](prompt.md)
