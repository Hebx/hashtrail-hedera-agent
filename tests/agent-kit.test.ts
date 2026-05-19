import { describe, expect, test } from "vitest";

import { buildHashTrailChatModel } from "../src/hedera/agent-kit.js";
import { loadEnv } from "../src/shared/env.js";

describe("buildHashTrailChatModel", () => {
  test("creates a Gemini chat model from HashTrail env", () => {
    const model = buildHashTrailChatModel(
      loadEnv({
        HBL_LIVE: "1",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "gemini",
        GEMINI_API_KEY: "test-key",
      }),
    );

    expect(model?.constructor.name).toBe("ChatGoogle");
  });

  test("returns null for deterministic no-LLM mode", () => {
    const model = buildHashTrailChatModel(
      loadEnv({
        HBL_LIVE: "1",
        HEDERA_OPERATOR_ID: "0.0.123",
        HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
        HBL_LLM_PROVIDER: "none",
      }),
    );

    expect(model).toBeNull();
  });
});
