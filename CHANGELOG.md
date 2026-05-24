# Changelog

All notable changes to HashTrail are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-24

### Added

- **Free-form Hedera Q&A** (`src/agent/free-form-agent.ts`). When an LLM
  provider is configured (`HBL_LLM_PROVIDER=gemini` or `openai`), inputs that
  do not match a deterministic command route to a Hedera Agent Kit ReAct
  agent built with LangChain v1 `createAgent`. The agent is filtered to
  read-only `get_*` query tools, so it can answer live-state questions like
  "what is the hcs topic id for the last transactions" without ever calling a
  write tool.
- New Agent Kit plugins on the toolkit: `coreTokenQueryPlugin`,
  `coreTransactionQueryPlugin`, `coreMiscQueriesPlugin`. The agent can now
  answer token-info, transaction-record, and exchange-rate questions.
- `HashTrailResult.mode` gains an `'agent'` variant alongside `'live'`, plus
  optional `agentAnswer` and `agentToolCalls` fields. The CLI prints both
  blocks when an agent answer is produced.
- Mermaid architecture flowchart and tip-flow sequence diagram in the README.
- New regression tests in `tests/live-hashtrail-agent.test.ts`: free-form
  routing into the agent boundary, deterministic priority for balance/read
  even when an agent boundary is provided, and a regression test for the
  `wantsMint` bug below.

### Fixed

- `wantsMint` regex was `/\bmint|token\b/i`, which matched any input
  containing the word "token" and triggered an HTS mint. Tightened to
  `/\b(mint|create)\b[^.?!]*\b(token|htfun)\b/i`. Caught while smoke-testing
  the new free-form path; one accidental `0.0.9005160` token was created on
  testnet before the fix landed.

### Changed

- README rewritten to remove duplicate sections (intro, user story, use case,
  core features, safety bullets all said the same thing). New structure:
  intro, mainnet proof, architecture + diagrams, quickstart, commands,
  address book, Tip Card NFT, safety model, verification, releases,
  contributing, license.
- CI (`.github/workflows/ci.yml`) sets `fetch-depth: 0` on the checkout step
  so the gitleaks PR scan can resolve commit ranges on multi-commit PRs.

### Security

- Free-form Q&A is read-only by construction. The toolkit passed to the LLM
  is filtered to `get_*` tools at build time, so the LLM cannot spend HBAR,
  mint NFTs, or write HCS regardless of prompt.
- All write actions (postcard, register, mint, tip, NFT) still flow through
  the deterministic regex parser and the existing policy gates
  (`WEEK1_ALLOW_*` flags, 1 HBAR cap, mainnet enable). The LLM cannot bypass
  them.

## [0.1.0] - 2026-05-22

Initial public release. Deterministic CLI for HCS postcards, HTS proof token,
HCS address-book registry, HBAR tipping with Tip Card NFT mint and transfer,
and a verified mainnet proof run on Hedera mainnet.

[0.2.0]: https://github.com/Hebx/hashtrail-hedera-agent/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Hebx/hashtrail-hedera-agent/releases/tag/v0.1.0
