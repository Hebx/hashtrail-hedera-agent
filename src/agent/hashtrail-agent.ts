import { runMockHashTrailAgent } from "./mock-hashtrail-agent.js";
import { buildHederaClient } from "../hedera/client.js";
import { createLiveHcsBoundary, type HcsLiveBoundary } from "../hedera/hcs.js";
import { enforceMintAllowlist } from "../policies/allowlist.js";
import type {
  HashTrailEnv,
  HashTrailPostcard,
  HashTrailResult,
} from "../shared/types.js";
import { AccountBalanceQuery, type Client } from "@hiero-ledger/sdk";

export type HashTrailLiveBoundaries = {
  getBalance: () => Promise<string>;
  hcs: HcsLiveBoundary;
};

function wantsMint(input: string): boolean {
  return /\bmint|token\b/i.test(input);
}

function wantsPostcardWrite(input: string): boolean {
  if (
    /\bread|latest|check\s+my\s+balance|balance\b/i.test(input) &&
    !/\b(make|create|post|submit|write)\b/i.test(input)
  ) {
    return false;
  }
  return true;
}

function buildPostcard(env: HashTrailEnv): HashTrailPostcard {
  return {
    kind: "hashtrail.postcard.v1",
    displayName: env.displayName,
    network: "testnet",
    message: `hello from ${env.displayName} on Hedera testnet`,
    createdAt: new Date().toISOString(),
    agent: "hashtrail-hedera-agent",
  };
}

async function getOperatorBalance(input: {
  client: Client;
  env: HashTrailEnv;
}): Promise<string> {
  if (!input.env.hederaOperatorId) {
    throw new Error("HEDERA_OPERATOR_ID is required");
  }

  const balance = await new AccountBalanceQuery()
    .setAccountId(input.env.hederaOperatorId)
    .execute(input.client);
  return balance.hbars.toString();
}

export async function runLiveHashTrailAgent(input: {
  input: string;
  env: HashTrailEnv;
  boundaries: HashTrailLiveBoundaries;
  readbackAttempts?: number;
  readbackRetryDelayMs?: number;
}): Promise<HashTrailResult> {
  const topicId = await input.boundaries.hcs.ensureTopic();
  const balance = await input.boundaries.getBalance();
  const postcard = buildPostcard(input.env);

  if (wantsMint(input.input)) {
    try {
      enforceMintAllowlist({
        toolName: "tokenMint",
        allowMint: input.env.allowMint,
      });
    } catch (error) {
      return {
        status: "denied",
        mode: "live",
        topicId,
        balance,
        postcard,
        latestMessages: await readLatestWithRetry(input),
        summary:
          error instanceof Error
            ? `Mint request declined: ${error.message}`
            : "Mint request declined: mint-not-allowed",
      };
    }
  }

  if (!wantsPostcardWrite(input.input)) {
    const latestMessages = await readLatestWithRetry(input);
    const noun = latestMessages.length === 1 ? "postcard" : "postcards";
    return {
      status: "ok",
      mode: "live",
      topicId,
      balance,
      postcard,
      latestMessages,
      summary: `HashTrail checked balance and read ${latestMessages.length} ${noun} from ${topicId} on Hedera testnet.`,
    };
  }

  const receipt = await input.boundaries.hcs.submitPostcard(postcard);
  const latestMessages = await readLatestWithRetry({
    ...input,
    topicId: receipt.topicId,
  });
  const sequence = receipt.sequenceNumber
    ? ` sequence=${receipt.sequenceNumber}`
    : "";
  const tx = receipt.transactionId ? ` tx=${receipt.transactionId}` : "";
  const pinTopic = input.env.hcsTopicId
    ? ""
    : ` Pin this topic in .env as HASHTRAIL_HCS_TOPIC_ID=${receipt.topicId}`;

  return {
    status: "ok",
    mode: "live",
    topicId: receipt.topicId,
    balance,
    postcard,
    latestMessages,
    summary: `HashTrail postcard posted to ${receipt.topicId} on Hedera testnet.${sequence}${tx}${pinTopic}`,
  };
}

async function readLatestWithRetry(input: {
  boundaries: HashTrailLiveBoundaries;
  topicId?: string;
  readbackAttempts?: number;
  readbackRetryDelayMs?: number;
}): Promise<HashTrailPostcard[]> {
  const attempts = input.readbackAttempts ?? 4;
  const retryDelayMs = input.readbackRetryDelayMs ?? 1_500;
  const topicId = input.topicId ?? (await input.boundaries.hcs.ensureTopic());

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const messages = await input.boundaries.hcs.readLatest(topicId, 3);
    if (messages.length > 0 || attempt === attempts) {
      return messages;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }

  return [];
}

export async function runHashTrailAgent(input: {
  input: string;
  env: HashTrailEnv;
}): Promise<HashTrailResult> {
  if (input.env.mode === "mock") {
    return runMockHashTrailAgent(input);
  }

  const client = buildHederaClient(input.env);
  try {
    return await runLiveHashTrailAgent({
      ...input,
      boundaries: {
        getBalance: () => getOperatorBalance({ client, env: input.env }),
        hcs: createLiveHcsBoundary({ client, env: input.env }),
      },
    });
  } finally {
    client.close();
  }
}
