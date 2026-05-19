export type RuntimeMode = "mock" | "live";

export type HashTrailEnv = {
  mode: RuntimeMode;
  hederaNetwork: "testnet";
  hederaOperatorId?: string;
  hederaOperatorKey?: string;
  hederaMirrorNodeUrl?: string;
  llmProvider: string;
  llmModel: string;
  openAiApiKey?: string;
  geminiApiKey?: string;
  displayName: string;
  hcsTopicId?: string;
  htsTokenId?: string;
  nftTokenId?: string;
  allowMint: boolean;
  allowTip: boolean;
  allowTipNft: boolean;
};

export type HashTrailPostcard = {
  kind: "hashtrail.postcard.v1";
  displayName: string;
  network: "testnet";
  message: string;
  createdAt: string;
  agent: "hashtrail-hedera-agent";
};

export type HashTrailResult = {
  status: "ok" | "denied";
  mode: RuntimeMode;
  topicId: string;
  balance: string;
  postcard: HashTrailPostcard;
  latestMessages: HashTrailPostcard[];
  hcsReceipt?: HcsSubmitReceipt;
  htsMint?: HtsMintReceipt;
  tip?: TipExecution;
  tipNft?: NftTransferReceipt;
  tipReceipt?: TipReceiptV1;
  summary: string;
};

export type TipExecution = {
  amountHbar: number;
  recipient: { accountId: string; source: "alias" | "accountId"; alias?: string };
  reason?: string;
  hbarTransfer: HbarTransferReceipt;
};

export type HbarTransferReceipt = {
  from: string;
  to: string;
  amountHbar: number;
  transactionId?: string;
};

export type NftMintReceipt = {
  tokenId: string;
  serial: number;
  transactionId?: string;
};

export type NftTransferReceipt = {
  tokenId: string;
  serial: number;
  to: string;
  transactionId?: string;
  transferred: boolean;
  reason?: string;
};

export type NftCollectionReceipt = {
  tokenId: string;
  transactionId?: string;
  created: boolean;
};

export type TipReceiptV1 = {
  kind: "hashtrail.receipt.v1";
  network: "testnet";
  agent: "hashtrail-hedera-agent";
  intent: "tip";
  displayName: string;
  createdAt: string;
  reason?: string;
  payment: {
    from: string;
    to: string;
    amountHbar: number;
    transactionId?: string;
  };
  tipCard?: {
    tokenId: string;
    serial: number;
    mintTransactionId?: string;
    transferTransactionId?: string;
    transferred: boolean;
    reason?: string;
  };
};

export type HcsSubmitReceipt = {
  topicId: string;
  transactionId?: string;
  sequenceNumber?: number;
};

export type HtsTokenReceipt = {
  tokenId: string;
  transactionId?: string;
  created: boolean;
};

export type HtsMintReceipt = {
  tokenId: string;
  amount: number;
  transactionId?: string;
  totalSupply?: string;
};
