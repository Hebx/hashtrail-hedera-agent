import { PrivateKey } from "@hiero-ledger/sdk";
import { describe, expect, test } from "vitest";

import { parseOperatorPrivateKey } from "../src/hedera/client.js";

describe("parseOperatorPrivateKey", () => {
  test("parses raw 64-hex Hedera ECDSA operator keys without deprecated DER inference", () => {
    const rawEcdsaKey = PrivateKey.generateECDSA().toStringRaw();

    const parsed = parseOperatorPrivateKey(rawEcdsaKey);

    expect(parsed.publicKey.toString()).toBe(
      PrivateKey.fromStringECDSA(rawEcdsaKey).publicKey.toString(),
    );
  });
});
