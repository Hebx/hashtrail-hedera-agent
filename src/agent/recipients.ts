import { dirname } from "node:path";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

import type { AddressBookReceiptV1, HashTrailEnv } from "../shared/types.js";

export type RecipientEntry = {
  accountId: string;
  note?: string;
};

export type RecipientRegistry = Record<string, RecipientEntry>;

export type RecipientListEntry = RecipientEntry & {
  alias: string;
};

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

export function normalizeRecipientAlias(alias: string): string {
  const normalized = alias.trim().toLowerCase();
  if (!/^[a-z0-9_.@-]{1,64}$/.test(normalized)) {
    throw new Error(
      "Recipient alias must be 1-64 characters: letters, numbers, _, ., @, or -",
    );
  }
  return normalized;
}

export function assertHederaAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!/^0\.0\.\d+$/.test(normalized)) {
    throw new Error("Recipient account id must look like 0.0.x");
  }
  return normalized;
}

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
  let alias: string;
  try {
    alias = normalizeRecipientAlias(aliasRaw);
  } catch {
    return { kind: "invalid", reason: "invalid-alias" };
  }
  try {
    assertHederaAccountId(accountId);
  } catch {
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

export function saveRecipientRegistry(
  registry: RecipientRegistry,
  path = "recipients.json",
): void {
  const dir = dirname(path);
  if (dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  const sorted = Object.fromEntries(
    Object.entries(registry).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
}

export function upsertRecipient(input: {
  registry: RecipientRegistry;
  alias: string;
  accountId: string;
  note?: string;
}): RecipientRegistry {
  const alias = normalizeRecipientAlias(input.alias);
  const accountId = assertHederaAccountId(input.accountId);
  return {
    ...input.registry,
    [alias]: {
      accountId,
      note: cleanNote(input.note),
    },
  };
}

export function removeRecipientAlias(input: {
  registry: RecipientRegistry;
  alias: string;
}): { registry: RecipientRegistry; removed: boolean } {
  const alias = normalizeRecipientAlias(input.alias);
  const registry = { ...input.registry };
  const removed = Boolean(registry[alias]);
  delete registry[alias];
  return { registry, removed };
}

export function listRecipientEntries(
  registry: RecipientRegistry,
): RecipientListEntry[] {
  return Object.entries(registry)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([alias, entry]) => ({ alias, ...entry }));
}

function cleanNote(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["'`]/, "").replace(/["'`]$/, "");
  return unquoted.length > 0 ? unquoted.slice(0, 120) : undefined;
}
