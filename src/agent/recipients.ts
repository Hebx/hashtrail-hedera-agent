import { readFileSync, existsSync } from "node:fs";

import type { AddressBookReceiptV1, HashTrailEnv } from "../shared/types.js";

export type RecipientEntry = {
  accountId: string;
  note?: string;
};

export type RecipientRegistry = Record<string, RecipientEntry>;

export type RecipientRef =
  | { kind: "alias"; value: string }
  | { kind: "accountId"; value: string };

export type ResolvedRecipient = {
  accountId: string;
  source: "alias" | "accountId";
  alias?: string;
  note?: string;
  registry?: "hcs" | "local";
};

export type AddressBookIntent =
  | {
      kind: "register";
      alias: string;
      accountId: string;
      note?: string;
    }
  | { kind: "invalid"; reason: "invalid-account-id" | "invalid-alias" };

const ADDRESS_BOOK_REGEX =
  /^\s*(?:register|add)\s+([A-Za-z0-9_.@-]+)\s+(?:as|to)\s+(0\.0\.\d+)(?:\s+for\s+(.+?))?\s*$/i;

export function resolveRecipient(
  ref: RecipientRef,
  registry: RecipientRegistry,
): ResolvedRecipient | null {
  if (ref.kind === "accountId") {
    return { accountId: ref.value, source: "accountId" };
  }

  const aliasKey = ref.value.toLowerCase();
  const entry = registry[aliasKey];
  if (!entry) {
    return null;
  }
  return {
    accountId: entry.accountId,
    source: "alias",
    alias: aliasKey,
    note: entry.note,
    registry: "local",
  };
}

export function parseAddressBookIntent(input: string): AddressBookIntent | null {
  const match = input.match(ADDRESS_BOOK_REGEX);
  if (!match) {
    return null;
  }

  const [, aliasRaw, accountId, noteRaw] = match;
  const alias = aliasRaw.toLowerCase();
  if (!/^[a-z0-9_.@-]{1,64}$/.test(alias)) {
    return { kind: "invalid", reason: "invalid-alias" };
  }
  if (!/^0\.0\.\d+$/.test(accountId)) {
    return { kind: "invalid", reason: "invalid-account-id" };
  }

  return {
    kind: "register",
    alias,
    accountId,
    note: cleanNote(noteRaw),
  };
}

export function buildAddressBookReceipt(input: {
  env: HashTrailEnv;
  alias: string;
  accountId: string;
  note?: string;
}): AddressBookReceiptV1 {
  return {
    kind: "hashtrail.address-book.v1",
    network: "testnet",
    agent: "hashtrail-hedera-agent",
    displayName: input.env.displayName,
    createdAt: new Date().toISOString(),
    alias: input.alias.toLowerCase(),
    accountId: input.accountId,
    note: input.note,
  };
}

export function registryFromAddressBookReceipts(
  messages: unknown[],
): RecipientRegistry {
  const registry: RecipientRegistry = {};
  for (const message of messages) {
    if (!isAddressBookReceipt(message)) {
      continue;
    }
    const alias = message.alias.toLowerCase();
    if (registry[alias]) {
      continue;
    }
    registry[alias] = {
      accountId: message.accountId,
      note: message.note,
    };
  }
  return registry;
}

export function isAddressBookReceipt(
  value: unknown,
): value is AddressBookReceiptV1 {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const parsed = value as Partial<AddressBookReceiptV1>;
  return (
    parsed.kind === "hashtrail.address-book.v1" &&
    parsed.network === "testnet" &&
    parsed.agent === "hashtrail-hedera-agent" &&
    typeof parsed.alias === "string" &&
    typeof parsed.accountId === "string" &&
    /^0\.0\.\d+$/.test(parsed.accountId) &&
    typeof parsed.createdAt === "string" &&
    typeof parsed.displayName === "string"
  );
}

export function loadRecipientRegistry(
  path = "recipients.json",
): RecipientRegistry {
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const registry: RecipientRegistry = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { accountId?: unknown }).accountId === "string"
    ) {
      const note = (value as { note?: unknown }).note;
      registry[key.toLowerCase()] = {
        accountId: (value as { accountId: string }).accountId,
        note: typeof note === "string" ? note : undefined,
      };
    }
  }
  return registry;
}

function cleanNote(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["'`]/, "").replace(/["'`]$/, "");
  return unquoted.length > 0 ? unquoted.slice(0, 120) : undefined;
}
