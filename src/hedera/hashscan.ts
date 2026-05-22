import type {
  HederaNetwork,
  HbarTransferReceipt,
  HtsMintReceipt,
  NftTransferReceipt,
} from "../shared/types.js";

function hashScanBaseUrl(network: HederaNetwork = "testnet"): string {
  return network === "mainnet"
    ? "https://hashscan.io/mainnet"
    : "https://hashscan.io/testnet";
}

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

export function hashScanAccountUrl(
  accountId: string,
  network: HederaNetwork = "testnet",
): string {
  return `${hashScanBaseUrl(network)}/account/${accountId}`;
}

export function hashScanTopicUrl(
  topicId: string,
  network: HederaNetwork = "testnet",
): string {
  return `${hashScanBaseUrl(network)}/topic/${topicId}`;
}

export function hashScanTokenUrl(
  tokenId: string,
  network: HederaNetwork = "testnet",
): string {
  return `${hashScanBaseUrl(network)}/token/${tokenId}`;
}

export function hashScanTransactionUrl(
  transactionId: string,
  network: HederaNetwork = "testnet",
): string {
  return `${hashScanBaseUrl(network)}/tx/${transactionId}`;
}

export function buildHashScanLinks(input: {
  network?: HederaNetwork;
  accountId?: string;
  topicId?: string;
  hcsTransactionId?: string;
  htsMint?: HtsMintReceipt;
  hbarTransfer?: HbarTransferReceipt;
  tipNft?: NftTransferReceipt;
}): HashScanLinks {
  const network = input.network ?? "testnet";
  return {
    ...(input.accountId
      ? { account: hashScanAccountUrl(input.accountId, network) }
      : {}),
    ...(input.topicId ? { topic: hashScanTopicUrl(input.topicId, network) } : {}),
    ...(input.hcsTransactionId
      ? {
          hcsTransaction: hashScanTransactionUrl(
            input.hcsTransactionId,
            network,
          ),
        }
      : {}),
    ...(input.htsMint?.tokenId
      ? { token: hashScanTokenUrl(input.htsMint.tokenId, network) }
      : {}),
    ...(input.htsMint?.transactionId
      ? {
          htsMintTransaction: hashScanTransactionUrl(
            input.htsMint.transactionId,
            network,
          ),
        }
      : {}),
    ...(input.hbarTransfer?.transactionId
      ? {
          tipHbarTransaction: hashScanTransactionUrl(
            input.hbarTransfer.transactionId,
            network,
          ),
        }
      : {}),
    ...(input.tipNft?.tokenId
      ? { tipNftToken: hashScanTokenUrl(input.tipNft.tokenId, network) }
      : {}),
    ...(input.tipNft?.transactionId
      ? {
          tipNftTransferTransaction: hashScanTransactionUrl(
            input.tipNft.transactionId,
            network,
          ),
        }
      : {}),
  };
}
