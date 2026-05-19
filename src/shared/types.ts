export type RuntimeMode = 'mock' | 'live';

export type HashTrailEnv = {
  mode: RuntimeMode;
  hederaNetwork: 'testnet';
  hederaOperatorId?: string;
  hederaOperatorKey?: string;
  hederaMirrorNodeUrl?: string;
  llmProvider: string;
  llmModel: string;
  openAiApiKey?: string;
  displayName: string;
  hcsTopicId?: string;
  allowMint: boolean;
};

export type HashTrailPostcard = {
  kind: 'hashtrail.postcard.v1';
  displayName: string;
  network: 'testnet';
  message: string;
  createdAt: string;
  agent: 'hashtrail-hedera-agent';
};

export type HashTrailResult = {
  status: 'ok' | 'denied';
  mode: RuntimeMode;
  topicId: string;
  balance: string;
  postcard: HashTrailPostcard;
  latestMessages: HashTrailPostcard[];
  summary: string;
};
