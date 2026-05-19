import { describe, expect, test } from "vitest";

import { parseTipIntent } from "../src/agent/tip-jar.js";
import { resolveRecipient } from "../src/agent/recipients.js";

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
