export type HederaNetwork = "testnet" | "mainnet";

export type HashTrailEnv = {
  hederaNetwork: HederaNetwork;
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
  tipCardMetadataUri?: string;
  allowMint: boolean;
  allowTip: boolean;
  allowTipNft: boolean;
};

export type HashTrailPostcard = {
  kind: "hashtrail.postcard.v1";
  displayName: string;
  network: HederaNetwork;
  message: string;
  createdAt: string;
  agent: "hashtrail-hedera-agent";
};

export type HashTrailResult = {
  status: "ok" | "denied";
  mode: "live" | "agent";
  topicId: string;
  balance: string;
  postcard: HashTrailPostcard;
  latestMessages: HashTrailPostcard[];
  hcsReceipt?: HcsSubmitReceipt;
  addressBookReceipt?: AddressBookReceiptV1;
  htsMint?: HtsMintReceipt;
  tip?: TipExecution;
  tipNft?: NftTransferReceipt;
  tipReceipt?: TipReceiptV1;
  summary: string;
  agentAnswer?: string;
  agentToolCalls?: AgentToolCall[];
};

export type AgentToolCall = {
  tool: string;
  transactionId?: string;
};

export type TipExecution = {
  amountHbar: number;
  recipient: {
    accountId: string;
    source: "alias" | "accountId";
    alias?: string;
    registry?: "hcs" | "local";
  };
  reason?: string;
  hbarTransfer: HbarTransferReceipt;
};

export type AddressBookReceiptV1 = {
  kind: "hashtrail.address-book.v1";
  network: HederaNetwork;
  agent: "hashtrail-hedera-agent";
  displayName: string;
  createdAt: string;
  alias: string;
  accountId: string;
  note?: string;
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
  network: HederaNetwork;
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
  recipient?: {
    alias?: string;
    accountId: string;
    registry?: "hcs" | "local";
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
