import { describe, expect, test } from "vitest";

import { runLiveHashTrailAgent } from "../src/agent/hashtrail-agent.js";
import { loadEnv } from "../src/shared/env.js";

describe("runLiveHashTrailAgent", () => {
  test("checks balance, submits a postcard, and reads HCS messages through live boundaries", async () => {
    const submitted: string[] = [];
    const env = loadEnv({
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

  test("mints one HTS fun token when minting is explicitly approved", async () => {
    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "none",
      WEEK1_ALLOW_MINT: "true",
      HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
      HASHTRAIL_HTS_TOKEN_ID: "",
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
            sequenceNumber: 10,
          }),
          readLatest: async () => [],
        },
        hts: {
          ensureToken: async () => ({
            tokenId: "0.0.888",
            transactionId: "0.0.123@1710000001.000000001",
            created: true,
          }),
          mintTinyToken: async () => ({
            tokenId: "0.0.888",
            amount: 1,
            transactionId: "0.0.123@1710000002.000000001",
            totalSupply: "1",
          }),
        },
      },
    });

    expect(result.status).toBe("ok");
    expect(result.htsMint?.tokenId).toBe("0.0.888");
    expect(result.htsMint?.amount).toBe(1);
    expect(result.summary).toContain("minted 1 HTFUN");
    expect(result.summary).toContain(
      "Pin this token in .env as HASHTRAIL_HTS_TOKEN_ID=0.0.888",
    );
  });

  test("tells the operator to pin a newly created HCS topic", async () => {
    const env = loadEnv({
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

  test("routes free-form questions to the free-form agent boundary in agent mode", async () => {
    let submitCalls = 0;
    let answeredInput = "";
    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "test-key",
      HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
    });

    const result = await runLiveHashTrailAgent({
      input: "what is the hcs account for the last transactions",
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
          readLatest: async () => [],
        },
        freeFormAgent: {
          answer: async (userInput) => {
            answeredInput = userInput;
            return {
              answer:
                "The HashTrail HCS topic is 0.0.777 and the most recent receipt was 0.0.123@1710000000.000000001.",
              toolCalls: [
                {
                  tool: "get_topic_messages_query_tool",
                  transactionId: "0.0.123@1710000000.000000001",
                },
              ],
            };
          },
        },
      },
    });

    expect(submitCalls).toBe(0);
    expect(answeredInput).toContain("hcs account");
    expect(result.mode).toBe("agent");
    expect(result.agentAnswer).toContain("0.0.777");
    expect(result.agentToolCalls).toEqual([
      {
        tool: "get_topic_messages_query_tool",
        transactionId: "0.0.123@1710000000.000000001",
      },
    ]);
    expect(result.summary).toContain("0.0.777");
  });

  test("keeps balance/read intent on the deterministic path even when an agent boundary is provided", async () => {
    let agentCalls = 0;
    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "test-key",
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
          submitPostcard: async () => ({ topicId: "0.0.777" }),
          readLatest: async () => [],
        },
        freeFormAgent: {
          answer: async () => {
            agentCalls += 1;
            return { answer: "should not run", toolCalls: [] };
          },
        },
      },
    });

    expect(agentCalls).toBe(0);
    expect(result.mode).toBe("live");
    expect(result.summary).toContain("read 0 postcards");
  });

  test("does not trigger a token mint when the user only asks a question that mentions the word 'token'", async () => {
    let mintCalls = 0;
    let agentCalls = 0;
    const env = loadEnv({
      HEDERA_OPERATOR_ID: "0.0.123",
      HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
      HBL_LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "test-key",
      WEEK1_ALLOW_MINT: "true",
      HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
    });

    const result = await runLiveHashTrailAgent({
      input: "look up token info for 0.0.9007634 and tell me the symbol",
      env,
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "1.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async () => ({ topicId: "0.0.777" }),
          readLatest: async () => [],
        },
        hts: {
          ensureToken: async () => ({
            tokenId: "0.0.999",
            created: false,
          }),
          mintTinyToken: async () => {
            mintCalls += 1;
            return { tokenId: "0.0.999", amount: 1 };
          },
        },
        freeFormAgent: {
          answer: async () => {
            agentCalls += 1;
            return {
              answer: "Token 0.0.9007634 has symbol HTTIP and total supply 1.",
              toolCalls: [
                {
                  tool: "get_token_info_query_tool",
                  transactionId: undefined,
                },
              ],
            };
          },
        },
      },
    });

    expect(mintCalls).toBe(0);
    expect(agentCalls).toBe(1);
    expect(result.mode).toBe("agent");
    expect(result.agentAnswer).toContain("HTTIP");
  });
});
