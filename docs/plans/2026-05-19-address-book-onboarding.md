# HashTrail Address Book Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make recipient management an intuitive HashTrail feature instead of manual `recipients.json` editing, then keep the recording script local.

**Architecture:** Add a local address-book command layer in the CLI for list/show/add/remove, add a testnet onboarding command that creates a recipient account with automatic token associations, and reuse the existing HCS `hashtrail.address-book.v1` registry path for public publishing. Keep private recipient keys and the video script under `.local/`.

**Tech Stack:** TypeScript, `@hiero-ledger/sdk`, Vitest, local JSON file storage, Hedera testnet HCS.

---

### Task 1: Local Address Book Commands

**Files:**
- Modify: `src/agent/recipients.ts`
- Modify: `src/cli.ts`
- Test: `tests/tip-jar.test.ts`

Add helpers to read/write `recipients.json`, upsert aliases, remove aliases, and format list/show output. Add CLI commands:

```bash
npm run hashtrail -- recipients add alice 0.0.9007632 --note "demo builder"
npm run hashtrail -- recipients list
npm run hashtrail -- recipients show alice
npm run hashtrail -- recipients remove alice
```

### Task 2: Testnet Recipient Onboarding

**Files:**
- Create: `src/hedera/recipient-account.ts`
- Modify: `src/cli.ts`
- Test: `tests/recipient-account.test.ts`

Add:

```bash
npm run hashtrail -- recipients create alice
```

It creates a Hedera testnet account with automatic token associations, writes public alias data to `recipients.json`, and writes private key material to `.local/recipients/alice.json`.

### Task 3: Public HCS Registry Publishing

**Files:**
- Modify: `src/cli.ts`
- Existing: `src/agent/hashtrail-agent.ts`
- Existing: `src/agent/recipients.ts`

Add:

```bash
npm run hashtrail -- recipients publish alice
```

It reuses the existing live agent registration path to publish `hashtrail.address-book.v1` to HCS.

### Task 4: Local Video Script

**Files:**
- Create local only: `.local/demo_script.md`
- Modify: `README.md`

Create a private recording script with the exact local commands and proof links. Do not commit `.local/demo_script.md`.

### Verification

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```
