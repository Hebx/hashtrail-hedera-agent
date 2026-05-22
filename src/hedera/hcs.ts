import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  type Client,
} from "@hiero-ledger/sdk";

import type {
  AddressBookReceiptV1,
  HashTrailEnv,
  HashTrailPostcard,
  TipReceiptV1,
} from "../shared/types.js";

export type HcsReceipt = {
  topicId: string;
  transactionId?: string;
  sequenceNumber?: number;
};

export type HcsLiveBoundary = {
  ensureTopic: () => Promise<string>;
  submitPostcard: (postcard: HashTrailPostcard) => Promise<HcsReceipt>;
  submitTipReceipt?: (receipt: TipReceiptV1) => Promise<HcsReceipt>;
  submitAddressBookReceipt?: (
    receipt: AddressBookReceiptV1,
  ) => Promise<HcsReceipt>;
  readLatest: (topicId: string, limit: number) => Promise<HashTrailPostcard[]>;
  readLatestRaw?: (topicId: string, limit: number) => Promise<unknown[]>;
};

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
      return submitJsonMessage({
        client: input.client,
        topicId,
        message: postcard,
      });
    },

    submitTipReceipt: async (receipt) => {
      const topicId = await ensureTopic();
      return submitJsonMessage({
        client: input.client,
        topicId,
        message: receipt,
      });
    },

    submitAddressBookReceipt: async (receipt) => {
      const topicId = await ensureTopic();
      return submitJsonMessage({
        client: input.client,
        topicId,
        message: receipt,
      });
    },

    readLatest: async (topicId, limit) =>
      readLatestPostcardsFromMirror({
        topicId,
        limit,
        mirrorNodeUrl:
          input.env.hederaMirrorNodeUrl ?? defaultMirrorNodeUrl(input.env),
      }),

    readLatestRaw: async (topicId, limit) =>
      readLatestRawFromMirror({
        topicId,
        limit,
        mirrorNodeUrl:
          input.env.hederaMirrorNodeUrl ?? defaultMirrorNodeUrl(input.env),
      }),
  };
}

async function submitJsonMessage(input: {
  client: Client;
  topicId: string;
  message: unknown;
}): Promise<HcsReceipt> {
  const response = await new TopicMessageSubmitTransaction()
    .setTopicId(input.topicId)
    .setMessage(JSON.stringify(input.message))
    .execute(input.client);
  const receipt = await response.getReceipt(input.client);

  return {
    topicId: input.topicId,
    transactionId: response.transactionId?.toString(),
    sequenceNumber: receipt.topicSequenceNumber?.toNumber(),
  };
}

type MirrorTopicMessage = {
  message?: string;
};

type MirrorTopicMessagesResponse = {
  messages?: MirrorTopicMessage[];
};

function defaultMirrorNodeUrl(env?: HashTrailEnv): string {
  return env?.hederaNetwork === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com"
    : "https://testnet.mirrornode.hedera.com";
}

async function readLatestPostcardsFromMirror(input: {
  topicId: string;
  limit: number;
  mirrorNodeUrl?: string;
}): Promise<HashTrailPostcard[]> {
  const messages = await readLatestRawFromMirror(input);
  return messages
    .filter((message): message is HashTrailPostcard => isHashTrailPostcard(message))
    .reverse();
}

async function readLatestRawFromMirror(input: {
  topicId: string;
  limit: number;
  mirrorNodeUrl?: string;
}): Promise<unknown[]> {
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
    .filter((message): message is unknown => message !== null);
}

function decodeMirrorMessage(encoded: string | undefined): unknown | null {
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function isHashTrailPostcard(value: unknown): value is HashTrailPostcard {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const parsed = value as Partial<HashTrailPostcard>;
  return (
    parsed.kind === "hashtrail.postcard.v1" &&
    (parsed.network === "testnet" || parsed.network === "mainnet") &&
    parsed.agent === "hashtrail-hedera-agent" &&
    typeof parsed.displayName === "string" &&
    typeof parsed.message === "string" &&
    typeof parsed.createdAt === "string"
  );
}
