#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";

import { runHashTrailAgent } from "./agent/hashtrail-agent.js";
import {
  assertHederaAccountId,
  listRecipientEntries,
  loadRecipientRegistry,
  normalizeRecipientAlias,
  removeRecipientAlias,
  saveRecipientRegistry,
  upsertRecipient,
} from "./agent/recipients.js";
import { buildHederaClient } from "./hedera/client.js";
import { buildHashScanLinks } from "./hedera/hashscan.js";
import { createRecipientAccount } from "./hedera/recipient-account.js";
import { loadEnv } from "./shared/env.js";
import type { HashTrailEnv, HashTrailResult } from "./shared/types.js";

const args = process.argv.slice(2);
const env = loadEnv();

if (args[0] === "recipients") {
  await handleRecipientsCommand(args.slice(1), env);
} else {
  const input = args.join(" ") || "make me a hashtrail postcard";
  const recipients = loadRecipientRegistry();
  const result = await runHashTrailAgent({ input, env, recipients });
  printHashTrailResult(result, env);
}

function printHashTrailResult(result: HashTrailResult, env: HashTrailEnv): void {
  console.log(`HashTrail status=${result.status} mode=${result.mode}`);
  console.log(`balance=${result.balance}`);
  console.log(`topicId=${result.topicId}`);
  console.log(`postcard=${JSON.stringify(result.postcard)}`);
  console.log("latest messages:");
  for (const [index, message] of result.latestMessages.entries()) {
    console.log(`${index + 1}. ${message.message}`);
  }
  if (result.agentAnswer) {
    console.log("agent answer:");
    console.log(result.agentAnswer);
  }
  if (result.agentToolCalls && result.agentToolCalls.length > 0) {
    console.log("agent tool calls:");
    for (const call of result.agentToolCalls) {
      const tx = call.transactionId ? ` tx=${call.transactionId}` : "";
      console.log(`- ${call.tool}${tx}`);
    }
  }
  console.log(result.summary);

  const hashScanLinks = buildHashScanLinks({
    network: env.hederaNetwork,
    accountId: env.hederaOperatorId,
    topicId: result.topicId,
    hcsTransactionId: result.hcsReceipt?.transactionId,
    htsMint: result.htsMint,
    hbarTransfer: result.tip?.hbarTransfer,
    tipNft: result.tipNft,
  });
  if (Object.keys(hashScanLinks).length > 0) {
    console.log("hashscan:");
    for (const [label, url] of Object.entries(hashScanLinks)) {
      console.log(`${label}=${url}`);
    }
  }

  if (result.status === "denied") {
    process.exitCode = 2;
  }
}

async function handleRecipientsCommand(
  args: string[],
  env: HashTrailEnv,
): Promise<void> {
  const [command, aliasRaw, accountIdRaw] = args;
  const registry = loadRecipientRegistry();

  if (command === "list") {
    const entries = listRecipientEntries(registry);
    if (entries.length === 0) {
      console.log("HashTrail address book is empty.");
      return;
    }
    console.log("HashTrail address book:");
    for (const entry of entries) {
      const note = entry.note ? ` - ${entry.note}` : "";
      console.log(`${entry.alias}: ${entry.accountId}${note}`);
    }
    return;
  }

  if (command === "show") {
    const alias = normalizeRecipientAlias(requireArg(aliasRaw, "alias"));
    const entry = registry[alias];
    if (!entry) {
      console.error(`Recipient not found: ${alias}`);
      process.exitCode = 2;
      return;
    }
    console.log(`alias=${alias}`);
    console.log(`accountId=${entry.accountId}`);
    if (entry.note) console.log(`note=${entry.note}`);
    return;
  }

  if (command === "add") {
    const alias = normalizeRecipientAlias(requireArg(aliasRaw, "alias"));
    const accountId = assertHederaAccountId(requireArg(accountIdRaw, "accountId"));
    const updated = upsertRecipient({
      registry,
      alias,
      accountId,
      note: optionValue(args, "--note"),
    });
    saveRecipientRegistry(updated);
    console.log(`Saved ${alias} as ${accountId} in local HashTrail address book.`);
    console.log(`Publish later with: npm run hashtrail -- recipients publish ${alias}`);
    return;
  }

  if (command === "remove") {
    const alias = normalizeRecipientAlias(requireArg(aliasRaw, "alias"));
    const result = removeRecipientAlias({ registry, alias });
    saveRecipientRegistry(result.registry);
    console.log(
      result.removed
        ? `Removed ${alias} from local HashTrail address book.`
        : `Recipient ${alias} was not in local HashTrail address book.`,
    );
    return;
  }

  if (command === "create") {
    const alias = normalizeRecipientAlias(requireArg(aliasRaw, "alias"));
    const client = buildHederaClient(env);
    try {
      const created = await createRecipientAccount({
        alias,
        client,
        initialBalanceHbar: numberOption(args, "--initial-balance", 1),
        maxAutomaticTokenAssociations: numberOption(
          args,
          "--auto-associations",
          10,
        ),
      });
      const updated = upsertRecipient({
        registry,
        alias,
        accountId: created.accountId,
        note: optionValue(args, "--note") ?? "created by HashTrail onboarding",
      });
      saveRecipientRegistry(updated);
      mkdirSync(".local/recipients", { recursive: true });
      writeFileSync(
        `.local/recipients/${alias}.json`,
        `${JSON.stringify(created, null, 2)}\n`,
      );
      console.log(`Created testnet recipient ${alias}: ${created.accountId}`);
      console.log(`Private key saved locally: .local/recipients/${alias}.json`);
      console.log(`Publish with: npm run hashtrail -- recipients publish ${alias}`);
    } finally {
      client.close();
    }
    return;
  }

  if (command === "publish") {
    const alias = normalizeRecipientAlias(requireArg(aliasRaw, "alias"));
    const entry = registry[alias];
    if (!entry) {
      console.error(`Recipient not found locally: ${alias}`);
      process.exitCode = 2;
      return;
    }
    const input = `register ${alias} as ${entry.accountId}${
      entry.note ? ` for ${entry.note}` : ""
    }`;
    const result = await runHashTrailAgent({ input, env, recipients: registry });
    printHashTrailResult(result, env);
    return;
  }

  console.log(`Usage:
npm run hashtrail -- recipients add <alias> <0.0.x> --note "demo builder"
npm run hashtrail -- recipients create <alias> [--initial-balance 1] [--auto-associations 10]
npm run hashtrail -- recipients publish <alias>
npm run hashtrail -- recipients list
npm run hashtrail -- recipients show <alias>
npm run hashtrail -- recipients remove <alias>`);
}

function requireArg(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required ${name}`);
  }
  return value;
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function numberOption(args: string[], name: string, fallback: number): number {
  const raw = optionValue(args, name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}
