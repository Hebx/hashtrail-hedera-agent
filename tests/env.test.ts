import { describe, expect, test } from "vitest";

import { loadEnv } from "../src/shared/env.js";

describe("loadEnv", () => {
  test("defaults to mock testnet mode without secrets", () => {
    const env = loadEnv({});

    expect(env.mode).toBe("mock");
    expect(env.hederaNetwork).toBe("testnet");
    expect(env.displayName).toBe("ihab");
  });

  test("rejects non-testnet networks", () => {
    expect(() => loadEnv({ HEDERA_NETWORK: "mainnet" })).toThrow(
      /HEDERA_NETWORK/,
    );
  });

  test("live mode requires Hedera credentials and permits deterministic no-llm execution", () => {
    expect(() => loadEnv({ HBL_LIVE: "1" })).toThrow(/HEDERA_OPERATOR_ID/);
    expect(() =>
      loadEnv({
        HBL_LIVE: "1",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "REPLACE_ME",
      }),
    ).toThrow(/HEDERA_OPERATOR_KEY/);
    expect(() =>
      loadEnv({
        HBL_LIVE: "1",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "openai",
      }),
    ).toThrow(/OPENAI_API_KEY/);

    expect(
      loadEnv({
        HBL_LIVE: "1",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
        HASHTRAIL_HTS_TOKEN_ID: "0.0.456",
      }).mode,
    ).toBe("live");

    expect(
      loadEnv({
        HASHTRAIL_HTS_TOKEN_ID: "0.0.456",
      }).htsTokenId,
    ).toBe("0.0.456");
  });
});
