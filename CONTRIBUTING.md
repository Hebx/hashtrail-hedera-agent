# Contributing

HashTrail is a small TypeScript CLI for Hedera receipt workflows. Keep changes
focused, production-oriented, and easy to verify.

## Local Setup

```bash
npm install
cp .env.example .env
```

Use a Hedera testnet operator account for development. Mainnet runs require
explicit `HASHTRAIL_ENABLE_MAINNET=true` and should only be used for intentional
release or proof work.

## Checks

Run the full verification set before opening a PR or publishing a release:

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run secrets:scan
```

## Safety

- Never commit `.env`, `.local/`, recipient keys, or generated private notes.
- Keep network-specific Hedera IDs out of shared environment examples.
- Preserve the spending and minting guards unless a change explicitly updates
  the safety model.
- Prefer deterministic `HBL_LLM_PROVIDER=none` paths for tests and demos that do
  not need model calls.

## Pull Requests

Include the problem, the changed behavior, and the verification output. For
changes that touch Hedera transactions, include testnet receipts or explain why
the change is local-only.
