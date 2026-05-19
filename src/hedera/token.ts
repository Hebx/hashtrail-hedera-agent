import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  type Client,
} from "@hiero-ledger/sdk";

import { parseOperatorPrivateKey } from "./client.js";
import type {
  HashTrailEnv,
  HtsMintReceipt,
  HtsTokenReceipt,
} from "../shared/types.js";

export type FunTokenSpec = {
  name: "HashTrail Fun Token";
  symbol: "HTFUN";
  maxSupply: 100;
  decimals: 0;
};

export const HASHTRAIL_FUN_TOKEN: FunTokenSpec = {
  name: "HashTrail Fun Token",
  symbol: "HTFUN",
  maxSupply: 100,
  decimals: 0,
};

export type HtsLiveBoundary = {
  ensureToken: () => Promise<HtsTokenReceipt>;
  mintTinyToken: (tokenId: string) => Promise<HtsMintReceipt>;
};

export function createLiveHtsBoundary(input: {
  client: Client;
  env: HashTrailEnv;
}): HtsLiveBoundary {
  let cachedTokenId = input.env.htsTokenId;

  async function ensureToken(): Promise<HtsTokenReceipt> {
    if (cachedTokenId) {
      return {
        tokenId: cachedTokenId,
        created: false,
      };
    }

    if (!input.env.hederaOperatorId || !input.env.hederaOperatorKey) {
      throw new Error(
        "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required",
      );
    }

    const operatorKey = parseOperatorPrivateKey(input.env.hederaOperatorKey);
    const response = await new TokenCreateTransaction()
      .setTokenName(HASHTRAIL_FUN_TOKEN.name)
      .setTokenSymbol(HASHTRAIL_FUN_TOKEN.symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(HASHTRAIL_FUN_TOKEN.maxSupply)
      .setDecimals(HASHTRAIL_FUN_TOKEN.decimals)
      .setInitialSupply(0)
      .setTreasuryAccountId(input.env.hederaOperatorId)
      .setSupplyKey(operatorKey.publicKey)
      .setTokenMemo("HashTrail Bounty 1 fun receipt token")
      .execute(input.client);
    const receipt = await response.getReceipt(input.client);
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId) {
      throw new Error("HTS token creation did not return a token id");
    }

    cachedTokenId = tokenId;
    return {
      tokenId,
      transactionId: response.transactionId?.toString(),
      created: true,
    };
  }

  return {
    ensureToken,
    mintTinyToken: async (tokenId) => {
      const response = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(1)
        .execute(input.client);
      const receipt = await response.getReceipt(input.client);
      return {
        tokenId,
        amount: 1,
        transactionId: response.transactionId?.toString(),
        totalSupply: receipt.totalSupply?.toString(),
      };
    },
  };
}
