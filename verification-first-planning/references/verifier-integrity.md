# Verifier ownership and integrity

## Planning-owned contract verification

The planning-owned contract verifier represents the acceptance target. Create it before implementation where practical, map it to the observable contract, execute it for the product baseline, and seal its executable artifacts with SHA-256 hashes before handoff. The implementation agent must not silently edit or replace these files.

Implementation agents may identify and propose contract changes. Only the user or a planning/review phase that the user explicitly authorized may approve one. After approval, update the behavioral specification as needed, update affected contract verification, rerun the affected product baseline, and create a new sealed manifest revision before implementation continues. Do not resume implementation against an approved changed contract until those steps are complete.

Use the repository's established test and verification layout. Do not move project artifacts solely to satisfy this skill or its evaluator. The manifest should include only executable artifacts that define acceptance and were created/selected during planning. Include a shared helper only when changing that helper could change acceptance behavior. Do not include implementation-owned tests or every test file in the repository.

## Implementation-owned verification

The implementation agent may freely add and modify unit tests, internal integration tests, regression tests, debugging tests, implementation-specific fixtures, and other checks used to reach the acceptance target. These checks support implementation but do not redefine the sealed contract verifier.

## Manifest format

Store the manifest in the project's planning location or another established location. Paths in `files` are relative to the project workspace root, use `/` separators, and identify the planning-owned executable contract verifier artifacts.

```json
{
  "version": 1,
  "revision": 1,
  "files": {
    "tests/acceptance/search.test.mjs": {
      "sha256": "<64-character lowercase SHA-256 hex digest>"
    }
  }
}
```

`version` identifies the manifest format. `revision` starts at `1` and increases each time an approved contract update is sealed. The sealer advances the revision when it replaces an existing valid manifest; it does not reset the revision to `1`.

Create the manifest after establishing the product baseline with the zero-dependency sealer, listing only planning-owned acceptance verifier files:

```sh
node scripts/seal-contract-verifiers.mjs docs/plans/<feature-slug>/verifier-integrity.json <verifier-file> [<additional-verifier-file> ...]
```

The sealer uses Node's built-in `node:crypto` module. Verify the created manifest with the zero-dependency checker:

```sh
node scripts/verify-contract-integrity.mjs docs/plans/<feature-slug>/verifier-integrity.json <project-root>
```

Use the installed skill's script path if the planning workspace does not contain the script. Record the actual manifest path, sealed file list, and runnable integrity command in the handoff. Run the integrity checker before final acceptance verification. It must return `0` when all files match, `1` when a sealed verifier is missing or changed, and `2` for an invalid invocation, unreadable/invalid manifest, or invalid path.

The manifest is the durable integrity check. Filesystem permissions may add friction but are not a substitute for hash verification.
