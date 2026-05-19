import { describe, expect, test } from "vitest";

import { runLiveHashTrailAgent } from "../src/agent/hashtrail-agent.js";
import { loadEnv } from "../src/shared/env.js";

describe("runLiveHashTrailAgent", () => {
  test("checks balance, submits a postcard, and reads HCS messages through live boundaries", async () => {
    const submitted: string[] = [];
    const env = loadEnv({
      HBL_LIVE: "1",
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      HASHTRAIL_DISPLAY_NAME: "lordheb",
      HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
    });

    const result = await runLiveHashTrailAgent({
      input: "make me a hashtrail postcard",
      env,
      boundaries: {
        getBalance: async () => "12.34000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async (postcard) => {
            submitted.push(postcard.message);
            return {
              topicId: "0.0.777",
              sequenceNumber: 9,
              transactionId: "0.0.123@1710000000.000000001",
            };
          },
          readLatest: async () => [
            {
              kind: "hashtrail.postcard.v1",
              displayName: "lordheb",
              network: "testnet",
              message: "hello from lordheb on Hedera testnet",
              createdAt: "2026-05-19T00:00:00.000Z",
              agent: "hashtrail-hedera-agent",
            },
          ],
        },
      },
    });

    expect(result.status).toBe("ok");
    expect(result.mode).toBe("live");
    expect(result.balance).toBe("12.34000000 HBAR");
    expect(result.topicId).toBe("0.0.777");
    expect(result.latestMessages).toHaveLength(1);
    expect(result.summary).toContain("sequence=9");
    expect(result.summary).toContain("tx=0.0.123@1710000000.000000001");
    expect(submitted).toEqual(["hello from lordheb on Hedera testnet"]);
  });

  test("keeps minting denied in live mode when WEEK1_ALLOW_MINT is false", async () => {
    const env = loadEnv({
      HBL_LIVE: "1",
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      WEEK1_ALLOW_MINT: "false",
    });

    const result = await runLiveHashTrailAgent({
      input: "mint the tiny fun token",
      env,
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "1.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async () => ({
            topicId: "0.0.777",
            sequenceNumber: 1,
          }),
          readLatest: async () => [],
        },
      },
    });

    expect(result.status).toBe("denied");
    expect(result.summary).toContain("mint-not-allowed");
  });

  test("tells the operator to pin a newly created HCS topic", async () => {
    const env = loadEnv({
      HBL_LIVE: "1",
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      HASHTRAIL_HCS_TOPIC_ID: "",
    });

    const result = await runLiveHashTrailAgent({
      input: "make me a hashtrail postcard",
      env,
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "1.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.999",
          submitPostcard: async () => ({ topicId: "0.0.999" }),
          readLatest: async () => [],
        },
      },
    });

    expect(result.summary).toContain(
      "Pin this topic in .env as HASHTRAIL_HCS_TOPIC_ID=0.0.999",
    );
  });

  test("waits briefly for mirror readback after submitting a live postcard", async () => {
    let readAttempts = 0;
    const env = loadEnv({
      HBL_LIVE: "1",
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      HASHTRAIL_HCS_TOPIC_ID: "",
    });

    const result = await runLiveHashTrailAgent({
      input: "make me a hashtrail postcard",
      env,
      readbackRetryDelayMs: 1,
      boundaries: {
        getBalance: async () => "1.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.999",
          submitPostcard: async () => ({ topicId: "0.0.999" }),
          readLatest: async () => {
            readAttempts += 1;
            return readAttempts === 1
              ? []
              : [
                  {
                    kind: "hashtrail.postcard.v1",
                    displayName: "ihab",
                    network: "testnet",
                    message: "hello from ihab on Hedera testnet",
                    createdAt: "2026-05-19T00:00:00.000Z",
                    agent: "hashtrail-hedera-agent",
                  },
                ];
          },
        },
      },
    });

    expect(readAttempts).toBe(2);
    expect(result.latestMessages).toHaveLength(1);
  });

  test("checks balance and reads postcards without submitting when the request is read-only", async () => {
    let submitCalls = 0;
    const env = loadEnv({
      HBL_LIVE: "1",
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
    });

    const result = await runLiveHashTrailAgent({
      input: "check my balance and read the last 3 postcards",
      env,
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "1.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async () => {
            submitCalls += 1;
            return { topicId: "0.0.777" };
          },
          readLatest: async () => [
            {
              kind: "hashtrail.postcard.v1",
              displayName: "ihab",
              network: "testnet",
              message: "existing postcard",
              createdAt: "2026-05-19T00:00:00.000Z",
              agent: "hashtrail-hedera-agent",
            },
          ],
        },
      },
    });

    expect(submitCalls).toBe(0);
    expect(result.latestMessages[0]?.message).toBe("existing postcard");
    expect(result.summary).toContain("read 1 postcard");
  });
});
