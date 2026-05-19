import 'dotenv/config';

import type { HashTrailEnv } from './types.js';

type EnvInput = Record<string, string | undefined>;

const PLACEHOLDER_VALUES = new Set(['', 'REPLACE_ME', '0.0.xxxxx']);

function read(input: EnvInput, key: string): string | undefined {
  return input[key] ?? process.env[key];
}

function requireLiveValue(input: EnvInput, key: string): string {
  const value = read(input, key);
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    throw new Error(`${key} is required when HBL_LIVE=1`);
  }
  return value;
}

export function loadEnv(input: EnvInput = process.env): HashTrailEnv {
  const network = read(input, 'HEDERA_NETWORK') ?? 'testnet';
  if (network !== 'testnet') {
    throw new Error(`HEDERA_NETWORK must be testnet, received ${network}`);
  }

  const mode = read(input, 'HBL_LIVE') === '1' ? 'live' : 'mock';
  const llmProvider = read(input, 'HBL_LLM_PROVIDER') ?? 'openai';

  if (mode === 'live') {
    requireLiveValue(input, 'HEDERA_OPERATOR_ID');
    requireLiveValue(input, 'HEDERA_OPERATOR_KEY');
    if (llmProvider === 'openai') {
      requireLiveValue(input, 'OPENAI_API_KEY');
    }
  }

  return {
    mode,
    hederaNetwork: 'testnet',
    hederaOperatorId: read(input, 'HEDERA_OPERATOR_ID'),
    hederaOperatorKey: read(input, 'HEDERA_OPERATOR_KEY'),
    hederaMirrorNodeUrl: read(input, 'HEDERA_MIRROR_NODE_URL'),
    llmProvider,
    llmModel: read(input, 'HBL_LLM_MODEL') ?? 'gpt-4o-mini',
    openAiApiKey: read(input, 'OPENAI_API_KEY'),
    displayName: read(input, 'HASHTRAIL_DISPLAY_NAME') ?? 'ihab',
    hcsTopicId: read(input, 'HASHTRAIL_HCS_TOPIC_ID'),
    allowMint: read(input, 'WEEK1_ALLOW_MINT') === 'true',
  };
}
