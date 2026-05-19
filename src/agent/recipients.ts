import { readFileSync, existsSync } from "node:fs";

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
};

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
  };
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
