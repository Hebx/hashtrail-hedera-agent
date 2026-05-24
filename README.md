# HashTrail

HashTrail is a Hedera receipt agent for verifiable contributor rewards.

Give it a plain-language instruction such as `tip 0.25 hbar to alice for
shipping the demo`, and it turns that intent into a public proof trail:

- an HBAR transfer
- an HCS receipt message
- optional HTS proof-token minting
- an optional wallet-renderable Tip Card NFT
- HashScan links for every public object
- policy logs around the agent tools that can spend or mint

The design goal is simple: an AI agent should not only say it completed an
action. It should leave a receipt that people can inspect later.

## User Story

As a community organizer, hackathon operator, DAO contributor, or small project
lead, I want to reward contributors with a simple AI command so each payment has
a public, readable receipt showing who was paid, why they were paid, and which
on-chain actions completed.

## Use Case: Verifiable Contributor Rewards

Small teams often reward work with a Discord message, spreadsheet row, wallet
transfer, or manual note. Those records are easy to lose and hard to audit.

HashTrail turns that workflow into a lightweight proof trail:

- **Actor:** a team lead, DAO operator, hackathon organizer, or community admin
- **Recipient:** a contributor, demo builder, reviewer, or helpful community
  member
- **Action:** send a small HBAR tip and issue a Tip Card NFT
- **Record:** write a public HCS receipt that includes the intent, payment, NFT
  outcome, timestamp, recipient registry, and transaction ids
- **Result:** anyone can later check HashScan or mirror-node data and verify the
  reward happened on Hedera

This is not a payroll system or a DAO treasury. It is a narrow production agent:
AI intent in, Hedera receipts out.

## Live Mainnet Proof

HashTrail has completed a real mainnet run with a renderable `HTTIP` NFT.

- Mainnet operator: `0.0.10489896`
- Recipient / NFT owner: `0.0.10231006`
- HCS topic: `0.0.10489911`
- Tip Card NFT collection: `0.0.10489912`
- Tip Card serial: `1`
- Metadata URI:
  `ipfs://bafkreiblekqyyf6di5ksmwyr45aoopvrbzxbunhywbm7ffnh4zcdeqcifi`
- HBAR tip transaction: `0.0.10489896@1779477337.887190474`
- NFT mint transaction: `0.0.10489896@1779477432.744595352`
- NFT transfer transaction: `0.0.10489896@1779477440.269786908`
- HCS receipt transaction: `0.0.10489896@1779477441.554100712`

HashScan:

- [Mainnet operator](https://hashscan.io/mainnet/account/0.0.10489896)
- [Recipient wallet](https://hashscan.io/mainnet/account/0.0.10231006)
- [HCS topic](https://hashscan.io/mainnet/topic/0.0.10489911)
- [Tip Card NFT collection](https://hashscan.io/mainnet/token/0.0.10489912)
- [HBAR tip](https://hashscan.io/mainnet/tx/0.0.10489896@1779477337.887190474)
- [NFT mint](https://hashscan.io/mainnet/tx/0.0.10489896@1779477432.744595352)
- [NFT transfer](https://hashscan.io/mainnet/tx/0.0.10489896@1779477440.269786908)
- [HCS receipt](https://hashscan.io/mainnet/tx/0.0.10489896@1779477441.554100712)
- [Metadata JSON](https://ipfs.io/ipfs/bafkreiblekqyyf6di5ksmwyr45aoopvrbzxbunhywbm7ffnh4zcdeqcifi)

Mirror node confirmed that token `0.0.10489912` serial `1` is owned by
`0.0.10231006`, and that the serial metadata decodes to the IPFS URI above.
Detailed notes live in
[`submission/mainnet-readiness.md`](submission/mainnet-readiness.md).

## Core Features

- **Plain-language commands:** run postcard, balance, mint, registry, and tip
  workflows from one CLI.
- **Free-form Hedera Q&A:** when an LLM is configured, any question that does
  not match a deterministic command routes to a Hedera Agent Kit ReAct agent
  with read-only query tools (HBAR balance, account info, topic info, topic
  messages, token info, transaction record, exchange rate). Same input,
  deterministic command path; new question, agent path.
- **HCS receipts:** writes `hashtrail.postcard.v1`,
  `hashtrail.address-book.v1`, and `hashtrail.receipt.v1` records.
- **Contributor aliases:** resolve `alice` from HCS address-book receipts before
  falling back to local `recipients.json`.
- **HBAR tips:** guarded by explicit opt-in flags and a 1 HBAR Agent Kit policy
  cap.
- **Tip Card NFTs:** creates or reuses an `HTTIP` collection, mints a serial,
  and transfers it to the recipient when the wallet can receive it.
- **Renderable metadata:** supports HIP-412 metadata URIs through
  `HASHTRAIL_TIP_CARD_METADATA_URI`.
- **Mainnet guard:** `HEDERA_NETWORK=mainnet` only works when
  `HASHTRAIL_ENABLE_MAINNET=true`.
- **Deterministic mode:** `HBL_LLM_PROVIDER=none` runs the command parser
  without an LLM key. Free-form Q&A is disabled and unrecognized inputs fall
  back to a balance/read response.

## Architecture

HashTrail is a TypeScript CLI built on:

- `@hashgraph/hedera-agent-kit@4`
- `@hashgraph/hedera-agent-kit-langchain`
- `@hiero-ledger/sdk`
- LangChain with Gemini or OpenAI adapters
- Hedera Mirror Node APIs for readback

Agent Kit plugins:

- `coreAccountQueryPlugin`
- `coreConsensusPlugin`
- `coreConsensusQueryPlugin`
- `coreTokenPlugin`
- `coreTokenQueryPlugin`
- `coreTransactionQueryPlugin`
- `coreMiscQueriesPlugin`

The Agent Kit boundary is in
[`src/hedera/agent-kit.ts`](src/hedera/agent-kit.ts). It wires three local
controls:

- `HashTrailMintAllowlistPolicy`: denies token create/mint unless
  `WEEK1_ALLOW_MINT=true`.
- `HashTrailHbarCapPolicy`: denies normalized HBAR amounts above 1 HBAR.
- `HashTrailAuditLogHook`: emits structured JSON audit lines after tool
  execution.

The top-level router in [`src/agent/hashtrail-agent.ts`](src/agent/hashtrail-agent.ts)
resolves intent in this order:

1. **Address book registration** (`register alice as 0.0.x`).
2. **Tip** (`tip 0.25 hbar to alice for ...`), gated by `WEEK1_ALLOW_TIP` and
   the 1 HBAR cap.
3. **Mint** (`mint the tiny fun token`), gated by `WEEK1_ALLOW_MINT`.
4. **Balance / read** (`check my balance and read the last 3 postcards`).
5. **Explicit postcard** (`make me a hashtrail postcard`).
6. **Free-form Q&A** through the Hedera Agent Kit ReAct agent in
   [`src/agent/free-form-agent.ts`](src/agent/free-form-agent.ts) when an LLM
   provider is configured. Read-only tools only.
7. **Deterministic fallback** (`HBL_LLM_PROVIDER=none`): unrecognized inputs
   return a balance/read response so the CLI never accidentally writes when
   the LLM is disabled.

## Quickstart

Requirements:

- Node.js `>=20`
- A Hedera testnet or mainnet operator account
- Optional Gemini or OpenAI API key for LLM parsing

Install:

```bash
npm install
cp .env.example .env
```

Run checks:

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Run a deterministic postcard without an LLM:

```dotenv
HBL_LLM_PROVIDER=none
HBL_LLM_MODEL=none
```

```bash
npm run hashtrail -- "make me a hashtrail postcard"
```

## Environment

Testnet shape:

```dotenv
HEDERA_NETWORK=testnet
HASHTRAIL_ENABLE_MAINNET=false
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=REPLACE_ME
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

HBL_LLM_PROVIDER=gemini
HBL_LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=REPLACE_ME

HASHTRAIL_DISPLAY_NAME=ihab
HASHTRAIL_HCS_TOPIC_ID=
HASHTRAIL_HTS_TOKEN_ID=
HASHTRAIL_NFT_TOKEN_ID=
HASHTRAIL_TIP_CARD_METADATA_URI=

WEEK1_ALLOW_MINT=true
WEEK1_ALLOW_TIP=true
WEEK1_ALLOW_TIP_NFT=true
```

Mainnet shape:

```dotenv
HEDERA_NETWORK=mainnet
HASHTRAIL_ENABLE_MAINNET=true
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=REPLACE_ME
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com

HBL_LLM_PROVIDER=none
HBL_LLM_MODEL=none

HASHTRAIL_DISPLAY_NAME=ihab
HASHTRAIL_HCS_TOPIC_ID=
HASHTRAIL_HTS_TOKEN_ID=
HASHTRAIL_NFT_TOKEN_ID=
HASHTRAIL_TIP_CARD_METADATA_URI=ipfs://REPLACE_WITH_METADATA_CID

WEEK1_ALLOW_MINT=false
WEEK1_ALLOW_TIP=true
WEEK1_ALLOW_TIP_NFT=true
```

For mainnet, keep IDs network-specific. Do not reuse testnet
`HASHTRAIL_HCS_TOPIC_ID`, `HASHTRAIL_HTS_TOKEN_ID`, or
`HASHTRAIL_NFT_TOKEN_ID` values in a mainnet run.

Never commit `.env`, `.local/`, or generated recipient keys.

## Commands

Post a receipt postcard:

```bash
npm run hashtrail -- "make me a hashtrail postcard"
```

Check balance and read recent HCS messages:

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

Create or reuse the optional `HTFUN` proof token:

```bash
npm run hashtrail -- "mint the tiny fun token"
```

Create a recipient account for demos:

```bash
npm run hashtrail -- recipients create alice --note "demo recipient"
```

Add an existing Hedera account to the local address book:

```bash
npm run hashtrail -- recipients add alice 0.0.xxxxx --note "demo recipient"
```

Publish the alias as an HCS address-book receipt:

```bash
npm run hashtrail -- recipients publish alice
```

Tip a contributor and mint a Tip Card NFT:

```bash
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

Ask free-form questions about the live Hedera state (LLM provider must be set):

```bash
npm run hashtrail -- "what is the hcs topic id for the last transactions and show me the last 3 messages"
npm run hashtrail -- "look up token info for 0.0.9007634 and tell me the name, symbol, and total supply"
```

The agent runs in read-only Q&A mode and only calls Hedera Agent Kit query
tools (`get_hbar_balance_query_tool`, `get_account_query_tool`,
`get_topic_messages_query_tool`, `get_token_info_query_tool`,
`get_transaction_record_query_tool`, `get_exchange_rate_tool`, ...). Write
actions (postcard, register, mint, tip, NFT) only fire on the deterministic
command paths above, so the same command keeps producing the same on-chain
receipt regardless of the LLM provider.

The tip command accepts a published alias, a local fallback alias, or a raw
`0.0.x` account id.

## Address Book

HashTrail uses three recipient layers:

- **Local registry:** `recipients.json`, gitignored and useful for bootstrap.
- **Generated demo account:** `recipients create <alias>` creates a Hedera
  account and stores the private key under `.local/recipients/`.
- **Public registry:** `recipients publish <alias>` writes a
  `hashtrail.address-book.v1` receipt to HCS.

The tip flow checks HCS address-book receipts first, then local
`recipients.json`. That keeps the public demo inspectable while preserving a
local fallback for setup.

## Tip Card NFT

The canonical Tip Card asset is
[`assets/tip-card/tip-card-v1.svg`](assets/tip-card/tip-card-v1.svg).

For wallet and marketplace rendering, mint with a public HIP-412 metadata URI:

```dotenv
HASHTRAIL_TIP_CARD_METADATA_URI=ipfs://REPLACE_WITH_METADATA_CID
```

Available metadata files:

- [`assets/tip-card/metadata.hip412.example.json`](assets/tip-card/metadata.hip412.example.json)
- [`assets/tip-card/metadata.hip412.json`](assets/tip-card/metadata.hip412.json)
- [`assets/tip-card/metadata.hip412.svg-default.json`](assets/tip-card/metadata.hip412.svg-default.json)

For production-style cards, prefer
`metadata.hip412.svg-default.json`. It uses the generic SVG as the default
wallet image, so the visible NFT says `HBAR TIP`, `HCS RECEIPT`, `HTS NFT`, and
`HASHSCAN PROOF` without binding the art to a single amount or recipient.

## Safety Model

HashTrail is intentionally narrow and guarded:

- Mainnet requires `HASHTRAIL_ENABLE_MAINNET=true`.
- Minting requires `WEEK1_ALLOW_MINT=true`.
- HBAR tipping requires `WEEK1_ALLOW_TIP=true`.
- Tip Card NFT mint/transfer requires `WEEK1_ALLOW_TIP_NFT=true`.
- HBAR transfer-capable Agent Kit tools are capped at 1 HBAR.
- NFT metadata URIs must be `ipfs://`, `ar://`, or `https://` and fit Hedera's
  100-byte serial metadata limit.
- Readback commands reuse pinned topic/token IDs instead of creating new objects.
- Free-form Q&A only exposes Hedera Agent Kit `get_*` query tools to the LLM.
  Write actions (postcard, register, mint, tip, NFT) only fire on the
  deterministic command paths, so the LLM cannot bypass the policy gates.
- Secrets and generated keys are gitignored.

If a recipient cannot accept the NFT, the HBAR tip can still complete. HashTrail
records the NFT outcome and reason in the HCS receipt.

## Verification

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run secrets:scan
```

The live transcript and reviewer-facing artifacts are in
[`submission/`](submission/):

- [`submission/demo-testnet-transcript.md`](submission/demo-testnet-transcript.md)
- [`submission/mainnet-readiness.md`](submission/mainnet-readiness.md)
