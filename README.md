# HashTrail

HashTrail is a friendly AI receipt agent for Hedera testnet.

Tell it what happened, and it turns a plain-language intent into a public
Hedera proof trail: HCS receipt, balance check, optional HTS token proof, and a
guarded HBAR tip sealed with a collectible Tip Card NFT.

The point is simple: an AI agent should not only say it did something. It should
leave a receipt that people can inspect later.

## The Story

A builder ships a demo. A community lead wants to send a small thank-you tip and
leave a public note proving what the reward was for. They do not want to learn
wallet internals, token standards, or consensus services during a live demo.

They type:

```bash
npm run hashtrail -- "register alice as 0.0.xxxxx for demo recipient"
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

HashTrail does the rest:

- checks the operator balance
- resolves `alice` from a public HCS address-book receipt
- sends the HBAR tip on Hedera testnet
- mints a small Tip Card NFT as a commemorative receipt
- transfers the NFT to the recipient when their account can receive it
- writes a `hashtrail.receipt.v1` message to Hedera Consensus Service
- prints HashScan links so anyone can inspect the proof

For a non-technical user, this feels like asking an assistant to "send a thank
you and save the receipt." For a Hedera reviewer, it demonstrates real testnet
use of HBAR transfers, HCS messages, HTS tokens, Agent Kit policy controls, and
readback from the public record.

## User Story

As a community organizer, hackathon operator, or small project lead, I want to
reward contributors with a simple AI command so that each payment has a public,
readable receipt showing who was paid, why they were paid, and which on-chain
actions completed.

## Use Case: Verifiable Contributor Rewards

Many small teams reward people informally: a quick tip, a thank-you note, a
spreadsheet row, or a Discord message. Those records are easy to lose and hard
to verify.

HashTrail turns that workflow into a lightweight proof trail:

- **Actor:** a team lead, DAO operator, hackathon organizer, or community admin
- **Recipient:** a contributor, demo builder, reviewer, or helpful community
  member
- **Action:** send a small HBAR tip and issue a Tip Card NFT
- **Record:** write a public HCS receipt that includes the intent, payment, NFT
  outcome, timestamp, recipient registry, and transaction ids
- **Result:** anyone can later check the HashScan links and see that the reward
  happened on Hedera testnet

This is intentionally modest. It is not a payroll system or a DAO treasury. It is
a clear first agent: AI intent in, Hedera receipts out.

## What The Live Demo Proves

The current live transcript is in
[`submission/demo-testnet-transcript.md`](submission/demo-testnet-transcript.md).

It shows five end-to-end testnet commands:

- post a HashTrail receipt postcard to HCS
- mint one bounded `HTFUN` proof token
- read back recent HCS messages
- register `alice` in a public HCS address-book receipt
- tip `0.25 HBAR` to a demo recipient and transfer a Tip Card NFT

Live proof objects from the latest transcript:

- HCS topic: `0.0.9004997`
- HTFUN token: `0.0.9005160`
- Tip Card NFT collection: `0.0.9007634`
- Tip Card design: [`assets/tip-card/tip-card-v1.svg`](assets/tip-card/tip-card-v1.svg)
- Demo recipient: `0.0.9007632`
- Address-book transaction: `0.0.7304745@1779232318.516978523`
- Tip HBAR transaction: `0.0.7304745@1779232320.299717768`
- Tip NFT transfer transaction: `0.0.7304745@1779232324.270092094`

## How To Understand Hedera In This Demo

You do not need to know Hedera to understand HashTrail. These are the pieces it
uses:

- **HBAR:** the testnet currency being tipped.
- **HCS:** Hedera Consensus Service, used here like a public receipt notebook.
- **HTS:** Hedera Token Service, used here to create the fun token and Tip Card
  NFT.
- **HashScan:** the block explorer links printed by the CLI so humans can verify
  the actions.
- **Hedera Agent Kit:** the tool layer that lets an AI-controlled workflow talk
  to Hedera with explicit safety policies.

## Safety Model

HashTrail is designed to be demo-friendly and hard to misuse:

- Testnet-only today. `HEDERA_NETWORK=mainnet` throws until a future mainnet
  release explicitly enables it.
- Real Hedera credentials are required; HashTrail does not ship a simulated
  execution mode.
- Gemini 2.5 Flash is supported for LLM mode, but deterministic
  `HBL_LLM_PROVIDER=none` works without any LLM key.
- Minting is disabled unless `WEEK1_ALLOW_MINT=true`.
- HBAR tips are disabled unless `WEEK1_ALLOW_TIP=true`.
- Tip Card NFT mint/transfer is disabled unless `WEEK1_ALLOW_TIP_NFT=true`.
- Parsed tip commands are capped before spending HBAR.
- Transfer-capable Agent Kit tools are covered by a 1 HBAR policy cap.
- `.env*`, `.local/`, and `recipients.json` are ignored.

## Hedera Agent Kit v4 Usage

HashTrail imports only the plugins needed for the demo:

- `coreAccountQueryPlugin`
- `coreConsensusPlugin`
- `coreConsensusQueryPlugin`
- `coreTokenPlugin`

The Agent Kit boundary is in `src/hedera/agent-kit.ts`. It wires three controls:

- `HashTrailMintAllowlistPolicy`: denies token create/mint unless
  `WEEK1_ALLOW_MINT=true`.
- `HashTrailHbarCapPolicy`: denies normalized HBAR amounts above 1 HBAR.
- `HashTrailAuditLogHook`: emits structured JSON audit lines after tool
  execution.

Chat-model wiring supports Gemini 2.5 Flash through LangChain's
`ChatGoogle` adapter. The deterministic path remains available with
`HBL_LLM_PROVIDER=none` for demos that should avoid LLM quota entirely.

## Quickstart

```bash
npm install
cp .env.example .env
```

Fill `.env` with a Hedera testnet operator account before running commands.
HashTrail intentionally executes against Hedera testnet instead of local sample
data.

## Commands

```bash
npm run hashtrail -- "make me a hashtrail postcard"
npm run hashtrail -- "check my balance and read the last 3 postcards"
npm run hashtrail -- "mint the tiny fun token"
npm run hashtrail -- "register alice as 0.0.xxxxx for demo recipient"
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

The mint command declines unless `WEEK1_ALLOW_MINT=true`.
The tip command declines unless `WEEK1_ALLOW_TIP=true`; aliases resolve from
`hashtrail.address-book.v1` HCS receipts first, then local `recipients.json` as
a bootstrap fallback.

## Testnet Mode

Testnet execution is intentionally guarded. Set real testnet credentials in
`.env`. Gemini 2.5 Flash is the default model. For the deterministic CLI path, set
`HBL_LLM_PROVIDER=none`; no LLM call is needed to check balance, write a
postcard, run the parsed tip command, or read HCS messages.

```dotenv
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=REPLACE_ME
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
HBL_LLM_PROVIDER=gemini
HBL_LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=REPLACE_ME
HASHTRAIL_HCS_TOPIC_ID=
HASHTRAIL_HTS_TOKEN_ID=
HASHTRAIL_NFT_TOKEN_ID=
WEEK1_ALLOW_MINT=true
WEEK1_ALLOW_TIP=true
WEEK1_ALLOW_TIP_NFT=true
```

Do not use mainnet credentials. Do not commit `.env`.

On first live postcard creation, HashTrail creates an HCS topic and prints:

```text
Pin this topic in .env as HASHTRAIL_HCS_TOPIC_ID=<topicId>
```

After pinning, read-only commands reuse the topic and do not submit a new
message:

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

To include the optional HTS proof step:

```bash
npm run hashtrail -- "mint the tiny fun token"
```

If no token id is pinned yet, HashTrail creates a bounded `HTFUN` token and
prints:

```text
Pin this token in .env as HASHTRAIL_HTS_TOKEN_ID=<tokenId>
```

To run the guarded tip jar:

```bash
npm run hashtrail -- "register alice as 0.0.xxxxx for demo recipient"
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

The recipient may be a raw `0.0.x` account id or an alias registered on HCS.
The registry command writes a `hashtrail.address-book.v1` receipt to the same
topic used for postcards and tip receipts. That makes the demo address book
inspectable on HashScan and replayable from mirror-node history.

`recipients.json` is still supported as a local bootstrap fallback:

```bash
cp recipients.example.json recipients.json
```

```json
{
  "alice": {
    "accountId": "0.0.xxxxx",
    "note": "demo recipient with automatic token associations enabled"
  }
}
```

`recipients.json` is gitignored so demo account choices do not leak into the
public submission branch. For a fully on-chain demo, run the registry command
before tipping; the tip flow reads HCS address-book receipts before checking
the local fallback file.

When `WEEK1_ALLOW_TIP_NFT=true`, the tip flow creates or reuses the `HTTIP` NFT
collection, mints one serial with compact tip metadata, tries to transfer it to
the recipient, and records the outcome in HCS. If the recipient cannot accept
the NFT, the HBAR tip still completes and the NFT serial is kept in treasury with
the reason recorded.

## Verification

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run demo
npm run demo:transcript
npm run secrets:scan
```

## Submission Files

- Demo/social post: fill in `submission/DRAFT.md`.
- Live transcript: `submission/demo-testnet-transcript.md`.
- Hedera tool feedback: fill in `submission/FEEDBACK.md`, then paste the
  submitted feedback link into `submission/DRAFT.md`.
