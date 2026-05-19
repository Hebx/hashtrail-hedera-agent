import type {
  HbarTransferReceipt,
  HtsMintReceipt,
  NftTransferReceipt,
} from "../shared/types.js";

const HASHSAN_TESTNET_BASE_URL = "https://hashscan.io/testnet";

export type HashScanLinks = {
  account?: string;
  topic?: string;
  hcsTransaction?: string;
  token?: string;
  htsMintTransaction?: string;
  tipHbarTransaction?: string;
  tipNftToken?: string;
  tipNftTransferTransaction?: string;
};

export function hashScanAccountUrl(accountId: string): string {
  return `${HASHSAN_TESTNET_BASE_URL}/account/${accountId}`;
}

export function hashScanTopicUrl(topicId: string): string {
  return `${HASHSAN_TESTNET_BASE_URL}/topic/${topicId}`;
}

export function hashScanTokenUrl(tokenId: string): string {
  return `${HASHSAN_TESTNET_BASE_URL}/token/${tokenId}`;
}

export function hashScanTransactionUrl(transactionId: string): string {
  return `${HASHSAN_TESTNET_BASE_URL}/tx/${transactionId}`;
}

export function buildHashScanLinks(input: {
  accountId?: string;
  topicId?: string;
  hcsTransactionId?: string;
  htsMint?: HtsMintReceipt;
  hbarTransfer?: HbarTransferReceipt;
  tipNft?: NftTransferReceipt;
}): HashScanLinks {
  return {
    ...(input.accountId
      ? { account: hashScanAccountUrl(input.accountId) }
      : {}),
    ...(input.topicId ? { topic: hashScanTopicUrl(input.topicId) } : {}),
    ...(input.hcsTransactionId
      ? { hcsTransaction: hashScanTransactionUrl(input.hcsTransactionId) }
      : {}),
    ...(input.htsMint?.tokenId
      ? { token: hashScanTokenUrl(input.htsMint.tokenId) }
      : {}),
    ...(input.htsMint?.transactionId
      ? {
          htsMintTransaction: hashScanTransactionUrl(
            input.htsMint.transactionId,
          ),
        }
      : {}),
    ...(input.hbarTransfer?.transactionId
      ? {
          tipHbarTransaction: hashScanTransactionUrl(
            input.hbarTransfer.transactionId,
          ),
        }
      : {}),
    ...(input.tipNft?.tokenId
      ? { tipNftToken: hashScanTokenUrl(input.tipNft.tokenId) }
      : {}),
    ...(input.tipNft?.transactionId
      ? {
          tipNftTransferTransaction: hashScanTransactionUrl(
            input.tipNft.transactionId,
          ),
        }
      : {}),
  };
}
