import { describe, expect, test } from "vitest";

import { parseTipIntent } from "../src/agent/tip-jar.js";
import {
  listRecipientEntries,
  parseAddressBookIntent,
  registryFromAddressBookReceipts,
  removeRecipientAlias,
  resolveRecipient,
  upsertRecipient,
} from "../src/agent/recipients.js";

describe("parseTipIntent", () => {
  test("parses amount, alias, and reason", () => {
    const parsed = parseTipIntent('tip 1 hbar to alice for "great talk"');
    expect(parsed).toEqual({
      kind: "tip",
      amountHbar: 1,
      recipient: { kind: "alias", value: "alice" },
      reason: "great talk",
    });
  });

  test("parses decimal amount, raw 0.0.x recipient, and unquoted reason", () => {
    const parsed = parseTipIntent("tip 0.25 hbar to 0.0.9005200 for shipping it");
    expect(parsed).toEqual({
      kind: "tip",
      amountHbar: 0.25,
      recipient: { kind: "accountId", value: "0.0.9005200" },
      reason: "shipping it",
    });
  });

  test("returns null for non-tip inputs", () => {
    expect(parseTipIntent("mint the tiny fun token")).toBeNull();
    expect(parseTipIntent("make me a hashtrail receipt")).toBeNull();
  });

  test("rejects amounts above the per-tip cap", () => {
    expect(parseTipIntent("tip 6 hbar to alice")).toEqual({
      kind: "invalid",
      reason: "amount-above-cap",
    });
  });

  test("rejects zero or negative amounts", () => {
    expect(parseTipIntent("tip 0 hbar to alice")).toEqual({
      kind: "invalid",
      reason: "amount-not-positive",
    });
  });
});

describe("resolveRecipient", () => {
  const registry = {
    alice: { accountId: "0.0.9005200", note: "demo recipient" },
  };

  test("resolves an alias case-insensitively", () => {
    expect(
      resolveRecipient({ kind: "alias", value: "Alice" }, registry),
    ).toEqual({
      accountId: "0.0.9005200",
      source: "alias",
      alias: "alice",
      note: "demo recipient",
      registry: "local",
    });
  });

  test("passes through a raw Hedera account id", () => {
    expect(
      resolveRecipient(
        { kind: "accountId", value: "0.0.9005200" },
        registry,
      ),
    ).toEqual({ accountId: "0.0.9005200", source: "accountId" });
  });

  test("returns null for unknown aliases", () => {
    expect(resolveRecipient({ kind: "alias", value: "bob" }, registry)).toBeNull();
  });
});

describe("local address book helpers", () => {
  test("upserts, lists, and removes local recipients", () => {
    const registry = upsertRecipient({
      registry: {},
      alias: "Alice",
      accountId: "0.0.9007632",
      note: "demo builder",
    });

    expect(registry.alice).toEqual({
      accountId: "0.0.9007632",
      note: "demo builder",
    });
    expect(listRecipientEntries(registry)).toEqual([
      {
        alias: "alice",
        accountId: "0.0.9007632",
        note: "demo builder",
      },
    ]);

    const removed = removeRecipientAlias({ registry, alias: "alice" });
    expect(removed.removed).toBe(true);
    expect(removed.registry.alice).toBeUndefined();
  });

  test("rejects invalid local address book entries", () => {
    expect(() =>
      upsertRecipient({
        registry: {},
        alias: "not allowed!",
        accountId: "0.0.9007632",
      }),
    ).toThrow(/Recipient alias/);
    expect(() =>
      upsertRecipient({
        registry: {},
        alias: "alice",
        accountId: "9007632",
      }),
    ).toThrow(/account id/);
  });
});

describe("address book registry", () => {
  test("parses address-book registration commands", () => {
    expect(
      parseAddressBookIntent("register alice as 0.0.9007632 for demo recipient"),
    ).toEqual({
      kind: "register",
      alias: "alice",
      accountId: "0.0.9007632",
      note: "demo recipient",
    });
  });

  test("builds a registry from HCS address-book receipts with latest entry winning", () => {
    const registry = registryFromAddressBookReceipts([
      {
        kind: "hashtrail.address-book.v1",
        network: "testnet",
        agent: "hashtrail-hedera-agent",
        displayName: "ihab",
        createdAt: "2026-05-19T23:00:00.000Z",
        alias: "alice",
        accountId: "0.0.9007632",
        note: "current",
      },
      {
        kind: "hashtrail.address-book.v1",
        network: "testnet",
        agent: "hashtrail-hedera-agent",
        displayName: "ihab",
        createdAt: "2026-05-19T22:00:00.000Z",
        alias: "alice",
        accountId: "0.0.1",
        note: "old",
      },
    ]);

    expect(registry.alice).toEqual({
      accountId: "0.0.9007632",
      note: "current",
    });
  });
});
