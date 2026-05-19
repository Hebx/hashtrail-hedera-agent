# HashTrail

HashTrail is a small Hedera Bounty 1 agent: a friendly testnet receipt-postcard CLI built with Hedera Agent Kit v4.

It checks the operator HBAR balance, creates or reuses an HCS topic, posts a `hashtrail.postcard.v1` message, reads recent HCS messages back, optionally mints a tiny fun token, and can run a guarded testnet tip flow that transfers HBAR, mints a Tip Card NFT, and writes a `hashtrail.receipt.v1` HCS receipt.

## Why This Fits Bounty 1

Week 1 asks builders to ship a first Hedera agent. HashTrail keeps that scope tight: one natural-language agent, one terminal demo, Hedera testnet only, no SDK or framework layer.

The useful part is the receipt loop. The agent does not just print a response locally; it models a simple HCS proof trail that can be read back.

## Hedera Agent Kit v4 Usage

HashTrail imports only the plugins it needs:

- `coreAccountQueryPlugin`
- `coreConsensusPlugin`
- `coreConsensusQueryPlugin`
- `coreTokenPlugin`

The Agent Kit v4 boundary is in `src/hedera/agent-kit.ts`. It wires three controls:

- `HashTrailMintAllowlistPolicy`: denies token create/mint unless `WEEK1_ALLOW_MINT=true`.
- `HashTrailHbarCapPolicy`: denies normalized HBAR amounts above 1 HBAR.
- `HashTrailAuditLogHook`: emits structured JSON audit lines after tool execution.

Live chat-model wiring supports Gemini 2.5 Flash through LangChain's `ChatGoogle` adapter. The deterministic path remains available with `HBL_LLM_PROVIDER=none` for demos that should avoid LLM quota entirely.

## Safety Model

- Testnet only. `HEDERA_NETWORK=mainnet` throws.
- Mock-first. `HBL_LIVE=0` makes the demo run without credentials or network calls.
- Minting is disabled by default.
- When `WEEK1_ALLOW_MINT=true`, minting is bounded to one `HTFUN` token per command.
- Tip transfers are disabled unless `WEEK1_ALLOW_TIP=true`.
- Tip Card NFT mint/transfer is disabled unless `WEEK1_ALLOW_TIP_NFT=true`.
- Parsed tip commands are capped before spending HBAR.
- Transfer-capable HAK tools are covered by a 1 HBAR post-normalization cap.
- `.env*` is ignored; only `.env.example` is committed.

## Quickstart

```bash
npm install
cp .env.example .env
npm run demo
```

Expected mock output includes:

- `mode=mock`
- `topicId=0.0.424242`
- a `hashtrail.postcard.v1` payload
- a latest-messages readback section

## Commands

```bash
npm run hashtrail -- "make me a hashtrail postcard"
npm run hashtrail -- "check my balance and read the last 3 postcards"
npm run hashtrail -- "mint the tiny fun token"
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

The mint command declines unless `WEEK1_ALLOW_MINT=true`.
The tip command declines unless `WEEK1_ALLOW_TIP=true`; aliases resolve from `recipients.json`.

## Live Testnet Mode

Live mode is intentionally guarded. Set real testnet credentials in `.env`.
Gemini 2.5 Flash is the default live model. For the deterministic CLI path, set
`HBL_LLM_PROVIDER=none`; no LLM call is needed to check balance, write a
postcard, run the parsed tip command, or read HCS messages.

```dotenv
HBL_LIVE=1
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
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

The recipient may be a raw `0.0.x` account id or an alias in `recipients.json`:

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

`recipients.json` is local and gitignored so demo account choices do not leak
into the public submission branch.

When `WEEK1_ALLOW_TIP_NFT=true`, the tip flow creates or reuses the `HTTIP`
NFT collection, mints one serial with compact tip metadata, tries to transfer it
to the recipient, and records the outcome in HCS. If the recipient cannot accept
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

## Submission Placeholders

- Demo/social post: fill in `submission/DRAFT.md`.
- Live transcript: generate `submission/demo-testnet-transcript.md` with `npm run demo:transcript`.
- Hedera tool feedback: fill in `submission/FEEDBACK.md`, then paste the submitted feedback link into `submission/DRAFT.md`.
