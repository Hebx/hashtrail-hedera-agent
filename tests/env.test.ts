import { describe, expect, test } from "vitest";

import { loadEnv } from "../src/shared/env.js";

describe("loadEnv", () => {
  test("guards mainnet behind an explicit enable flag", () => {
    expect(() =>
      loadEnv({
        HEDERA_NETWORK: "mainnet",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
      }),
    ).toThrow(/HASHTRAIL_ENABLE_MAINNET/);

    expect(
      loadEnv({
        HEDERA_NETWORK: "mainnet",
        HASHTRAIL_ENABLE_MAINNET: "true",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
      }).hederaNetwork,
    ).toBe("mainnet");

    expect(() => loadEnv({ HEDERA_NETWORK: "previewnet" })).toThrow(
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

  test("accepts compact public Tip Card metadata URIs for NFT wallet rendering", () => {
    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      HASHTRAIL_TIP_CARD_METADATA_URI: "ipfs://bafkreihashtrailtipcardmetadata",
    });

    expect(env.tipCardMetadataUri).toBe(
      "ipfs://bafkreihashtrailtipcardmetadata",
    );
  });

  test("rejects Tip Card metadata URIs that cannot fit Hedera serial metadata", () => {
    expect(() =>
      loadEnv({
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
        HASHTRAIL_TIP_CARD_METADATA_URI: `ipfs://${"a".repeat(100)}`,
      }),
    ).toThrow(/HASHTRAIL_TIP_CARD_METADATA_URI/);
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
