import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  type Client,
} from "@hiero-ledger/sdk";

import type { HashTrailEnv, HashTrailPostcard } from "../shared/types.js";

export type HcsReceipt = {
  topicId: string;
  transactionId?: string;
  sequenceNumber?: number;
};

export type HcsLiveBoundary = {
  ensureTopic: () => Promise<string>;
  submitPostcard: (postcard: HashTrailPostcard) => Promise<HcsReceipt>;
  readLatest: (topicId: string, limit: number) => Promise<HashTrailPostcard[]>;
};

export function createUnimplementedHcsBoundary(): HcsLiveBoundary {
  return {
    ensureTopic: async () => {
      throw new Error("Live HCS topic creation is not enabled in mock mode");
    },
    submitPostcard: async () => {
      throw new Error("Live HCS submission is not enabled in mock mode");
    },
    readLatest: async () => {
      throw new Error("Live HCS query is not enabled in mock mode");
    },
  };
}

export function createLiveHcsBoundary(input: {
  client: Client;
  env: HashTrailEnv;
}): HcsLiveBoundary {
  let cachedTopicId = input.env.hcsTopicId;

  async function ensureTopic(): Promise<string> {
    if (cachedTopicId) {
      return cachedTopicId;
    }

    const response = await new TopicCreateTransaction()
      .setTopicMemo("HashTrail Bounty 1 postcard receipts")
      .execute(input.client);
    const receipt = await response.getReceipt(input.client);
    const topicId = receipt.topicId?.toString();
    if (!topicId) {
      throw new Error("HCS topic creation did not return a topic id");
    }
    cachedTopicId = topicId;
    return topicId;
  }

  return {
    ensureTopic,
    submitPostcard: async (postcard) => {
      const topicId = await ensureTopic();
      const response = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(postcard))
        .execute(input.client);
      const receipt = await response.getReceipt(input.client);

      return {
        topicId,
        transactionId: response.transactionId?.toString(),
        sequenceNumber: receipt.topicSequenceNumber?.toNumber(),
      };
    },

    readLatest: async (topicId, limit) =>
      readLatestPostcardsFromMirror({
        topicId,
        limit,
        mirrorNodeUrl: input.env.hederaMirrorNodeUrl,
      }),
  };
}

type MirrorTopicMessage = {
  message?: string;
};

type MirrorTopicMessagesResponse = {
  messages?: MirrorTopicMessage[];
};

function defaultMirrorNodeUrl(): string {
  return "https://testnet.mirrornode.hedera.com";
}

async function readLatestPostcardsFromMirror(input: {
  topicId: string;
  limit: number;
  mirrorNodeUrl?: string;
}): Promise<HashTrailPostcard[]> {
  const baseUrl = (input.mirrorNodeUrl || defaultMirrorNodeUrl()).replace(
    /\/$/,
    "",
  );
  const url = `${baseUrl}/api/v1/topics/${input.topicId}/messages?limit=${input.limit}&order=desc`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Mirror node read failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as MirrorTopicMessagesResponse;
  return (body.messages ?? [])
    .map((message) => decodeMirrorMessage(message.message))
    .filter((message): message is HashTrailPostcard => message !== null)
    .reverse();
}

function decodeMirrorMessage(
  encoded: string | undefined,
): HashTrailPostcard | null {
  if (!encoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf8"),
    ) as Partial<HashTrailPostcard>;
    if (
      parsed.kind === "hashtrail.postcard.v1" &&
      parsed.network === "testnet" &&
      parsed.agent === "hashtrail-hedera-agent" &&
      typeof parsed.displayName === "string" &&
      typeof parsed.message === "string" &&
      typeof parsed.createdAt === "string"
    ) {
      return parsed as HashTrailPostcard;
    }
  } catch {
    return null;
  }

  return null;
}
