import { runMockHashTrailAgent } from "./mock-hashtrail-agent.js";
import { buildHederaClient } from "../hedera/client.js";
import { createLiveHcsBoundary, type HcsLiveBoundary } from "../hedera/hcs.js";
import {
  createLiveHtsBoundary,
  HASHTRAIL_FUN_TOKEN,
  type HtsLiveBoundary,
} from "../hedera/token.js";
import { createLiveNftBoundary, type NftLiveBoundary } from "../hedera/nft.js";
import { createLiveTipBoundary, type TipLiveBoundary } from "../hedera/tip.js";
import { enforceMintAllowlist } from "../policies/allowlist.js";
import { resolveRecipient, type RecipientRegistry } from "./recipients.js";
import { parseTipIntent } from "./tip-jar.js";
import type {
  HashTrailEnv,
  HashTrailPostcard,
  HashTrailResult,
  NftMintReceipt,
  NftTransferReceipt,
  TipExecution,
  TipReceiptV1,
} from "../shared/types.js";
import { AccountBalanceQuery, type Client } from "@hiero-ledger/sdk";

export type HashTrailLiveBoundaries = {
  getBalance: () => Promise<string>;
  hcs: HcsLiveBoundary;
  hts?: HtsLiveBoundary;
  nft?: NftLiveBoundary;
  tip?: TipLiveBoundary;
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
  recipients?: RecipientRegistry;
  readbackAttempts?: number;
  readbackRetryDelayMs?: number;
}): Promise<HashTrailResult> {
  const topicId = await input.boundaries.hcs.ensureTopic();
  const balance = await input.boundaries.getBalance();
  const postcard = buildPostcard(input.env);
  const tipIntent = parseTipIntent(input.input);

  if (tipIntent) {
    if (tipIntent.kind === "invalid") {
      return {
        status: "denied",
        mode: "live",
        topicId,
        balance,
        postcard,
        latestMessages: await readLatestWithRetry(input),
        summary: `Tip request declined: ${tipIntent.reason}`,
      };
    }

    if (!input.env.allowTip) {
      return {
        status: "denied",
        mode: "live",
        topicId,
        balance,
        postcard,
        latestMessages: await readLatestWithRetry(input),
        summary: "Tip request declined: tip-not-allowed",
      };
    }

    const recipient = resolveRecipient(tipIntent.recipient, input.recipients ?? {});
    if (!recipient) {
      return {
        status: "denied",
        mode: "live",
        topicId,
        balance,
        postcard,
        latestMessages: await readLatestWithRetry(input),
        summary: "Tip request declined: recipient-not-found",
      };
    }

    if (!input.boundaries.tip) {
      throw new Error("Tip live boundary is required when tipping is approved");
    }
    if (!input.boundaries.hcs.submitTipReceipt) {
      throw new Error("HCS tip receipt boundary is required when tipping is approved");
    }

    const hbarTransfer = await input.boundaries.tip.transferHbar(
      recipient.accountId,
      tipIntent.amountHbar,
    );
    const tip: TipExecution = {
      amountHbar: tipIntent.amountHbar,
      recipient: {
        accountId: recipient.accountId,
        source: recipient.source,
        alias: recipient.alias,
      },
      reason: tipIntent.reason,
      hbarTransfer,
    };
    const nftResult = input.env.allowTipNft
      ? await mintAndTransferTipNft({
          env: input.env,
          boundaries: input.boundaries,
          recipientId: recipient.accountId,
          amountHbar: tipIntent.amountHbar,
          reason: tipIntent.reason,
        })
      : undefined;
    const tipReceipt = buildTipReceipt({
      env: input.env,
      tip,
      nftMint: nftResult?.mint,
      nftTransfer: nftResult?.transfer,
    });
    const receipt = await input.boundaries.hcs.submitTipReceipt(tipReceipt);
    const latestMessages = await readLatestWithRetry({
      ...input,
      topicId: receipt.topicId,
    });
    const nftSummary = nftResult
      ? nftResult.transfer.transferred
        ? ` Tip Card NFT ${nftResult.transfer.tokenId} serial ${nftResult.transfer.serial} transferred.`
        : ` Tip Card NFT ${nftResult.transfer.tokenId} serial ${nftResult.transfer.serial} kept in treasury (${nftResult.transfer.reason ?? "transfer-not-complete"}).`
      : "";

    return {
      status: "ok",
      mode: "live",
      topicId: receipt.topicId,
      balance,
      postcard,
      latestMessages,
      hcsReceipt: receipt,
      tip,
      tipNft: nftResult?.transfer,
      tipReceipt,
      summary: `Tipped ${tipIntent.amountHbar} HBAR to ${recipient.accountId} on Hedera testnet.${nftSummary}`,
    };
  }

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

    if (!input.boundaries.hts) {
      throw new Error("HTS live boundary is required when minting is approved");
    }

    const token = await input.boundaries.hts.ensureToken();
    const mint = await input.boundaries.hts.mintTinyToken(token.tokenId);
    const receipt = await input.boundaries.hcs.submitPostcard(postcard);
    const latestMessages = await readLatestWithRetry({
      ...input,
      topicId: receipt.topicId,
    });
    const pinToken =
      token.created && !input.env.htsTokenId
        ? ` Pin this token in .env as HASHTRAIL_HTS_TOKEN_ID=${token.tokenId}`
        : "";

    return {
      status: "ok",
      mode: "live",
      topicId: receipt.topicId,
      balance,
      postcard,
      latestMessages,
      hcsReceipt: receipt,
      htsMint: mint,
      summary: `HashTrail minted ${mint.amount} ${HASHTRAIL_FUN_TOKEN.symbol} on Hedera testnet token=${mint.tokenId}${mint.transactionId ? ` tx=${mint.transactionId}` : ""}${pinToken}`,
    };
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
    hcsReceipt: receipt,
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
  recipients?: RecipientRegistry;
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
        hts: createLiveHtsBoundary({ client, env: input.env }),
        nft: createLiveNftBoundary({ client, env: input.env }),
        tip: createLiveTipBoundary({ client, env: input.env }),
      },
      recipients: input.recipients,
    });
  } finally {
    client.close();
  }
}

async function mintAndTransferTipNft(input: {
  env: HashTrailEnv;
  boundaries: HashTrailLiveBoundaries;
  recipientId: string;
  amountHbar: number;
  reason?: string;
}): Promise<{ mint: NftMintReceipt; transfer: NftTransferReceipt }> {
  if (!input.boundaries.nft) {
    throw new Error("NFT live boundary is required when tip NFTs are approved");
  }

  const collection = await input.boundaries.nft.ensureNftCollection();
  const mint = await input.boundaries.nft.mintNftSerial(
    collection.tokenId,
    buildTipCardMetadata({
      recipientId: input.recipientId,
      amountHbar: input.amountHbar,
      reason: input.reason,
    }),
  );
  const transfer = await input.boundaries.nft.transferNftSerial(
    collection.tokenId,
    mint.serial,
    input.recipientId,
  );
  return { mint, transfer };
}

function buildTipCardMetadata(input: {
  recipientId: string;
  amountHbar: number;
  reason?: string;
}): string {
  return JSON.stringify({
    k: "hashtrail.tip-card.v1",
    to: input.recipientId,
    a: input.amountHbar,
    ...(input.reason ? { r: input.reason.slice(0, 24) } : {}),
  });
}

function buildTipReceipt(input: {
  env: HashTrailEnv;
  tip: TipExecution;
  nftMint?: NftMintReceipt;
  nftTransfer?: NftTransferReceipt;
}): TipReceiptV1 {
  return {
    kind: "hashtrail.receipt.v1",
    network: "testnet",
    agent: "hashtrail-hedera-agent",
    intent: "tip",
    displayName: input.env.displayName,
    createdAt: new Date().toISOString(),
    reason: input.tip.reason,
    payment: {
      from: input.tip.hbarTransfer.from,
      to: input.tip.hbarTransfer.to,
      amountHbar: input.tip.hbarTransfer.amountHbar,
      transactionId: input.tip.hbarTransfer.transactionId,
    },
    ...(input.nftMint && input.nftTransfer
      ? {
          tipCard: {
            tokenId: input.nftMint.tokenId,
            serial: input.nftMint.serial,
            mintTransactionId: input.nftMint.transactionId,
            transferTransactionId: input.nftTransfer.transactionId,
            transferred: input.nftTransfer.transferred,
            reason: input.nftTransfer.reason,
          },
        }
      : {}),
  };
}
