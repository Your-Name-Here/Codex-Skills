# Shopping plans and preferences

For a recipe request, list likely ingredients and quantities before searching. Use only pantry information the user has supplied. When a quantity depends materially on serving count or recipe style, ask one concise question; otherwise state a reasonable assumption and continue. Round purchase quantity up to whole packages and show what that rounding means.

Search each required ingredient, compare only compatible candidates, and report missing ingredients and proposed substitutions explicitly. Do not add recipe items to the cart until requested.

## Preferences

Keep persistent preferences separate from live site state. Never infer a permanent preference from a single purchase. Store only preferences the user directly states and do not write credentials, payment information, precise location, or medical information.

Use a small JSON file at `$CODEX_HOME/walmart-shopping-preferences.json` (or `~/.codex/walmart-shopping-preferences.json` when `CODEX_HOME` is unset). Create it only when the user asks to save a preference. Merge explicit changes without discarding unrelated fields. The empty schema is in [preferences.example.json](preferences.example.json).

For a one-time request, apply the preference in the current task without persisting it. Do not interpret the example schema's empty fields as actual user preferences.
