import {
  Status,
  StatusError,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
  type Client,
} from "@hiero-ledger/sdk";

import { parseOperatorPrivateKey } from "./client.js";
import type {
  HashTrailEnv,
  NftCollectionReceipt,
  NftMintReceipt,
  NftTransferReceipt,
} from "../shared/types.js";

export type NftSpec = {
  name: "HashTrail Tip Card";
  symbol: "HTTIP";
  maxSupply: 1000;
};

export const HASHTRAIL_TIP_CARD: NftSpec = {
  name: "HashTrail Tip Card",
  symbol: "HTTIP",
  maxSupply: 1000,
};

export type NftLiveBoundary = {
  ensureNftCollection: () => Promise<NftCollectionReceipt>;
  mintNftSerial: (
    tokenId: string,
    metadataJson: string,
  ) => Promise<NftMintReceipt>;
  transferNftSerial: (
    tokenId: string,
    serial: number,
    to: string,
  ) => Promise<NftTransferReceipt>;
};

export function createLiveNftBoundary(input: {
  client: Client;
  env: HashTrailEnv;
}): NftLiveBoundary {
  let cachedTokenId = input.env.nftTokenId;

  async function ensureNftCollection(): Promise<NftCollectionReceipt> {
    if (cachedTokenId) {
      return { tokenId: cachedTokenId, created: false };
    }
    if (!input.env.hederaOperatorId || !input.env.hederaOperatorKey) {
      throw new Error(
        "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required",
      );
    }
    const operatorKey = parseOperatorPrivateKey(input.env.hederaOperatorKey);
    const response = await new TokenCreateTransaction()
      .setTokenName(HASHTRAIL_TIP_CARD.name)
      .setTokenSymbol(HASHTRAIL_TIP_CARD.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(HASHTRAIL_TIP_CARD.maxSupply)
      .setInitialSupply(0)
      .setTreasuryAccountId(input.env.hederaOperatorId)
      .setSupplyKey(operatorKey.publicKey)
      .setTokenMemo("HashTrail Bounty 1 tip card NFT")
      .execute(input.client);
    const receipt = await response.getReceipt(input.client);
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId) {
      throw new Error("NFT collection creation did not return a token id");
    }
    cachedTokenId = tokenId;
    return {
      tokenId,
      transactionId: response.transactionId?.toString(),
      created: true,
    };
  }

  async function mintNftSerial(
    tokenId: string,
    metadataJson: string,
  ): Promise<NftMintReceipt> {
    const metadata = Buffer.from(metadataJson, "utf8");
    if (metadata.length > 100) {
      // Hedera NFT metadata is capped at 100 bytes per serial.
      throw new Error(
        `NFT metadata too long: ${metadata.length} bytes (max 100). Use a digest or shorter JSON.`,
      );
    }
    const response = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([metadata])
      .execute(input.client);
    const receipt = await response.getReceipt(input.client);
    const serial = receipt.serials?.[0]?.toNumber();
    if (typeof serial !== "number") {
      throw new Error("NFT mint did not return a serial number");
    }
    return {
      tokenId,
      serial,
      transactionId: response.transactionId?.toString(),
    };
  }

  async function transferNftSerial(
    tokenId: string,
    serial: number,
    to: string,
  ): Promise<NftTransferReceipt> {
    if (!input.env.hederaOperatorId) {
      throw new Error("HEDERA_OPERATOR_ID is required");
    }
    try {
      const response = await new TransferTransaction()
        .addNftTransfer(`${tokenId}/${serial}`, input.env.hederaOperatorId, to)
        .execute(input.client);
      await response.getReceipt(input.client);
      return {
        tokenId,
        serial,
        to,
        transactionId: response.transactionId?.toString(),
        transferred: true,
      };
    } catch (error) {
      const reason = classifyTransferError(error);
      if (!reason) {
        throw error;
      }
      return {
        tokenId,
        serial,
        to,
        transferred: false,
        reason,
      };
    }
  }

  return {
    ensureNftCollection,
    mintNftSerial,
    transferNftSerial,
  };
}

function classifyTransferError(error: unknown): string | null {
  if (error instanceof StatusError) {
    if (error.status === Status.TokenNotAssociatedToAccount) {
      return "token-not-associated";
    }
    return `transfer-failed:${error.status.toString()}`;
  }
  if (error instanceof Error) {
    if (/TOKEN_NOT_ASSOCIATED_TO_ACCOUNT/.test(error.message)) {
      return "token-not-associated";
    }
  }
  return null;
}
