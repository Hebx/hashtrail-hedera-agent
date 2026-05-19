import { describe, expect, test } from "vitest";

import { loadEnv } from "../src/shared/env.js";

describe("loadEnv", () => {
  test("rejects non-testnet networks", () => {
    expect(() => loadEnv({ HEDERA_NETWORK: "mainnet" })).toThrow(
      /HEDERA_NETWORK/,
    );
  });

  test("requires Hedera credentials and permits deterministic no-llm execution", () => {
    expect(() => loadEnv({})).toThrow(/HEDERA_OPERATOR_ID/);
    expect(() =>
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "REPLACE_ME",
      }),
    ).toThrow(/HEDERA_OPERATOR_KEY/);
    expect(() =>
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "openai",
      }),
    ).toThrow(/OPENAI_API_KEY/);

    expect(
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
        HASHTRAIL_HTS_TOKEN_ID: "0.0.456",
      }).hederaNetwork,
    ).toBe("testnet");

    expect(
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
        HASHTRAIL_HTS_TOKEN_ID: "0.0.456",
      }).htsTokenId,
    ).toBe("0.0.456");
  });

  test("live Gemini mode requires GEMINI_API_KEY and defaults to Gemini 2.5 Flash", () => {
    expect(() =>
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "gemini",
      }),
    ).toThrow(/GEMINI_API_KEY/);

    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "test-key",
    });

    expect(env.llmProvider).toBe("gemini");
    expect(env.llmModel).toBe("gemini-2.5-flash");
    expect(env.geminiApiKey).toBe("test-key");
  });
});
