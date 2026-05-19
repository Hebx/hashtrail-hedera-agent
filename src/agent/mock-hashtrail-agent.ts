import { enforceMintAllowlist } from '../policies/allowlist.js';
import type { HashTrailEnv, HashTrailPostcard, HashTrailResult } from '../shared/types.js';

const MOCK_TOPIC_ID = '0.0.424242';
const MOCK_BALANCE = '42.00000000 HBAR';

function wantsMint(input: string): boolean {
  return /\bmint|token\b/i.test(input);
}

function buildPostcard(env: HashTrailEnv): HashTrailPostcard {
  return {
    kind: 'hashtrail.postcard.v1',
    displayName: env.displayName,
    network: 'testnet',
    message: `hello from ${env.displayName} on Hedera testnet`,
    createdAt: '2026-05-19T00:00:00.000Z',
    agent: 'hashtrail-hedera-agent',
  };
}

export async function runMockHashTrailAgent(input: {
  input: string;
  env: HashTrailEnv;
}): Promise<HashTrailResult> {
  const postcard = buildPostcard(input.env);

  if (wantsMint(input.input)) {
    try {
      enforceMintAllowlist({
        toolName: 'tokenMint',
        allowMint: input.env.allowMint,
      });
    } catch (error) {
      return {
        status: 'denied',
        mode: 'mock',
        topicId: MOCK_TOPIC_ID,
        balance: MOCK_BALANCE,
        postcard,
        latestMessages: [postcard],
        summary:
          error instanceof Error
            ? `Mint request declined: ${error.message}`
            : 'Mint request declined: mint-not-allowed',
      };
    }
  }

  return {
    status: 'ok',
    mode: 'mock',
    topicId: MOCK_TOPIC_ID,
    balance: MOCK_BALANCE,
    postcard,
    latestMessages: [
      postcard,
      {
        ...postcard,
        message: 'mock readback: HashTrail keeps HCS receipts visible',
      },
      {
        ...postcard,
        message: 'mock readback: no mainnet, no fund transfers',
      },
    ],
    summary: `HashTrail postcard posted to ${MOCK_TOPIC_ID} in mock mode and read back successfully.`,
  };
}
