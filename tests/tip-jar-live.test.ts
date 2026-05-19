import { describe, expect, test } from "vitest";

import { runLiveHashTrailAgent } from "../src/agent/hashtrail-agent.js";
import { loadEnv } from "../src/shared/env.js";

const baseLiveEnv = {
  HBL_LIVE: "1",
  HEDERA_OPERATOR_ID: "0.0.123",
  HEDERA_OPERATOR_KEY: "302e020100300506032b657004220420abc",
  HBL_LLM_PROVIDER: "none",
  HASHTRAIL_HCS_TOPIC_ID: "0.0.777",
  HASHTRAIL_HTS_TOKEN_ID: "0.0.888",
  HASHTRAIL_NFT_TOKEN_ID: "0.0.999",
  WEEK1_ALLOW_TIP: "true",
  WEEK1_ALLOW_TIP_NFT: "true",
};

describe("runLiveHashTrailAgent tip flow", () => {
  test("transfers HBAR, mints + transfers a tip NFT, and posts a tip receipt", async () => {
    const env = loadEnv(baseLiveEnv);
    const transferCalls: { recipientId: string; amountHbar: number }[] = [];
    const nftMintCalls: string[] = [];
    const nftTransferCalls: {
      tokenId: string;
      serial: number;
      to: string;
    }[] = [];
    const hcsMessages: string[] = [];

    const result = await runLiveHashTrailAgent({
      input: 'tip 1 hbar to 0.0.9005200 for "shipping demo"',
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "100.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async () => ({ topicId: "0.0.777" }),
          submitTipReceipt: async (receipt) => {
            hcsMessages.push(JSON.stringify(receipt));
            return {
              topicId: "0.0.777",
              sequenceNumber: 42,
              transactionId: "0.0.123@1710000200.000000001",
            };
          },
          submitAddressBookReceipt: async () => ({ topicId: "0.0.777" }),
          readLatest: async () => [],
          readLatestRaw: async () => [],
        },
        hts: {
          ensureToken: async () => ({ tokenId: "0.0.888", created: false }),
          mintTinyToken: async () => ({
            tokenId: "0.0.888",
            amount: 1,
          }),
        },
        nft: {
          ensureNftCollection: async () => ({
            tokenId: "0.0.999",
            created: false,
          }),
          mintNftSerial: async (tokenId, metadata) => {
            nftMintCalls.push(metadata);
            return {
              tokenId,
              serial: 7,
              transactionId: "0.0.123@1710000100.000000001",
            };
          },
          transferNftSerial: async (tokenId, serial, to) => {
            nftTransferCalls.push({ tokenId, serial, to });
            return {
              tokenId,
              serial,
              to,
              transactionId: "0.0.123@1710000150.000000001",
              transferred: true,
            };
          },
        },
        tip: {
          transferHbar: async (recipientId, amountHbar) => {
            transferCalls.push({ recipientId, amountHbar });
            return {
              from: "0.0.123",
              to: recipientId,
              amountHbar,
              transactionId: "0.0.123@1710000000.000000001",
            };
          },
        },
      },
    });

    expect(result.status).toBe("ok");
    expect(result.tip?.recipient.accountId).toBe("0.0.9005200");
    expect(result.tip?.amountHbar).toBe(1);
    expect(transferCalls).toEqual([
      { recipientId: "0.0.9005200", amountHbar: 1 },
    ]);
    expect(nftMintCalls).toHaveLength(1);
    expect(nftMintCalls[0]).toContain("hashtrail.tip-card.v1");
    expect(nftTransferCalls).toEqual([
      { tokenId: "0.0.999", serial: 7, to: "0.0.9005200" },
    ]);
    expect(hcsMessages).toHaveLength(1);
    expect(hcsMessages[0]).toContain("hashtrail.receipt.v1");
    expect(hcsMessages[0]).toContain("shipping demo");
    expect(result.summary).toContain("Tipped 1 HBAR");
    expect(result.summary).toContain("0.0.9005200");
    expect(result.summary).toContain("serial 7");
  });

  test("registers an alias as an HCS address-book receipt", async () => {
    const env = loadEnv(baseLiveEnv);
    const hcsMessages: string[] = [];

    const result = await runLiveHashTrailAgent({
      input: "register alice as 0.0.9007632 for demo recipient",
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: {
        ...makeNoopBoundaries(),
        hcs: {
          ...makeNoopBoundaries().hcs,
          submitAddressBookReceipt: async (receipt) => {
            hcsMessages.push(JSON.stringify(receipt));
            return {
              topicId: "0.0.777",
              sequenceNumber: 3,
              transactionId: "0.0.123@1710000300.000000001",
            };
          },
        },
      },
    });

    expect(result.status).toBe("ok");
    expect(result.addressBookReceipt).toMatchObject({
      kind: "hashtrail.address-book.v1",
      alias: "alice",
      accountId: "0.0.9007632",
      note: "demo recipient",
    });
    expect(hcsMessages[0]).toContain("hashtrail.address-book.v1");
    expect(result.summary).toContain("HashTrail HCS address book");
  });

  test("resolves tip aliases from HCS address-book receipts before local fallback", async () => {
    const env = loadEnv(baseLiveEnv);
    const transferCalls: { recipientId: string; amountHbar: number }[] = [];

    const result = await runLiveHashTrailAgent({
      input: "tip 0.5 hbar to alice for testing",
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: {
        ...makeNoopBoundaries(),
        hcs: {
          ...makeNoopBoundaries().hcs,
          readLatestRaw: async () => [
            {
              kind: "hashtrail.address-book.v1",
              network: "testnet",
              agent: "hashtrail-hedera-agent",
              displayName: "ihab",
              createdAt: "2026-05-19T23:00:00.000Z",
              alias: "alice",
              accountId: "0.0.9007632",
            },
          ],
        },
        tip: {
          transferHbar: async (recipientId, amountHbar) => {
            transferCalls.push({ recipientId, amountHbar });
            return {
              from: "0.0.123",
              to: recipientId,
              amountHbar,
              transactionId: "0.0.123@1710000000.000000001",
            };
          },
        },
      },
    });

    expect(result.status).toBe("ok");
    expect(result.tip?.recipient).toMatchObject({
      accountId: "0.0.9007632",
      alias: "alice",
      registry: "hcs",
    });
    expect(result.tipReceipt?.recipient?.registry).toBe("hcs");
    expect(transferCalls).toEqual([
      { recipientId: "0.0.9007632", amountHbar: 0.5 },
    ]);
  });

  test("denies tip flow when WEEK1_ALLOW_TIP is false", async () => {
    const env = loadEnv({ ...baseLiveEnv, WEEK1_ALLOW_TIP: "false" });

    const result = await runLiveHashTrailAgent({
      input: "tip 0.5 hbar to 0.0.9005200 for testing",
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: makeNoopBoundaries(),
    });

    expect(result.status).toBe("denied");
    expect(result.summary).toContain("tip-not-allowed");
  });

  test("rejects unknown aliases without spending HBAR", async () => {
    const env = loadEnv(baseLiveEnv);
    const transferCalls: unknown[] = [];

    const result = await runLiveHashTrailAgent({
      input: "tip 0.5 hbar to bob for testing",
      env,
      recipients: {
        alice: { accountId: "0.0.9005200" },
      },
      readbackAttempts: 1,
      boundaries: {
        ...makeNoopBoundaries(),
        tip: {
          transferHbar: async (...args) => {
            transferCalls.push(args);
            return {
              from: "0.0.123",
              to: "0.0.0",
              amountHbar: 0,
            };
          },
        },
      },
    });

    expect(transferCalls).toHaveLength(0);
    expect(result.status).toBe("denied");
    expect(result.summary).toContain("recipient-not-found");
  });

  test("rejects amounts above the per-tip cap before spending HBAR", async () => {
    const env = loadEnv(baseLiveEnv);
    const transferCalls: unknown[] = [];

    const result = await runLiveHashTrailAgent({
      input: "tip 50 hbar to 0.0.9005200",
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: {
        ...makeNoopBoundaries(),
        tip: {
          transferHbar: async (...args) => {
            transferCalls.push(args);
            return {
              from: "0.0.123",
              to: "0.0.0",
              amountHbar: 0,
            };
          },
        },
      },
    });

    expect(transferCalls).toHaveLength(0);
    expect(result.status).toBe("denied");
    expect(result.summary).toContain("amount-above-cap");
  });

  test("falls back to keeping the NFT in treasury when transfer to recipient fails (no association)", async () => {
    const env = loadEnv({
      ...baseLiveEnv,
      WEEK1_ALLOW_TIP_NFT: "true",
    });
    const transferCalls: { recipientId: string; amountHbar: number }[] = [];

    const result = await runLiveHashTrailAgent({
      input: 'tip 0.25 hbar to 0.0.9005200 for "thanks"',
      env,
      recipients: {},
      readbackAttempts: 1,
      boundaries: {
        getBalance: async () => "5.00000000 HBAR",
        hcs: {
          ensureTopic: async () => "0.0.777",
          submitPostcard: async () => ({ topicId: "0.0.777" }),
          submitTipReceipt: async () => ({
            topicId: "0.0.777",
            sequenceNumber: 1,
          }),
          readLatest: async () => [],
          readLatestRaw: async () => [],
        },
        hts: {
          ensureToken: async () => ({ tokenId: "0.0.888", created: false }),
          mintTinyToken: async () => ({ tokenId: "0.0.888", amount: 1 }),
        },
        nft: {
          ensureNftCollection: async () => ({
            tokenId: "0.0.999",
            created: false,
          }),
          mintNftSerial: async () => ({ tokenId: "0.0.999", serial: 5 }),
          transferNftSerial: async () => ({
            tokenId: "0.0.999",
            serial: 5,
            to: "0.0.9005200",
            transferred: false,
            reason: "token-not-associated",
          }),
        },
        tip: {
          transferHbar: async (recipientId, amountHbar) => {
            transferCalls.push({ recipientId, amountHbar });
            return {
              from: "0.0.123",
              to: recipientId,
              amountHbar,
            };
          },
        },
      },
    });

    expect(transferCalls).toHaveLength(1);
    expect(result.status).toBe("ok");
    expect(result.tipNft?.transferred).toBe(false);
    expect(result.summary).toContain("kept in treasury");
  });
});

function makeNoopBoundaries() {
  return {
    getBalance: async () => "0.00000000 HBAR",
    hcs: {
      ensureTopic: async () => "0.0.777",
      submitPostcard: async () => ({ topicId: "0.0.777" }),
      submitTipReceipt: async () => ({ topicId: "0.0.777", sequenceNumber: 0 }),
      submitAddressBookReceipt: async () => ({ topicId: "0.0.777" }),
      readLatest: async () => [],
      readLatestRaw: async () => [],
    },
    hts: {
      ensureToken: async () => ({ tokenId: "0.0.888", created: false }),
      mintTinyToken: async () => ({ tokenId: "0.0.888", amount: 1 }),
    },
    nft: {
      ensureNftCollection: async () => ({
        tokenId: "0.0.999",
        created: false,
      }),
      mintNftSerial: async () => ({ tokenId: "0.0.999", serial: 1 }),
      transferNftSerial: async () => ({
        tokenId: "0.0.999",
        serial: 1,
        to: "0.0.0",
        transferred: false,
        reason: "not-attempted",
      }),
    },
    tip: {
      transferHbar: async () => ({
        from: "0.0.123",
        to: "0.0.0",
        amountHbar: 0,
      }),
    },
  };
}
