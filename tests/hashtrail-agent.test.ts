import { describe, expect, test } from 'vitest';

import { runMockHashTrailAgent } from '../src/agent/mock-hashtrail-agent.js';
import { loadEnv } from '../src/shared/env.js';

describe('runMockHashTrailAgent', () => {
  test('creates a deterministic mock postcard receipt', async () => {
    const result = await runMockHashTrailAgent({
      input: 'make me a hashtrail postcard',
      env: loadEnv({ HASHTRAIL_DISPLAY_NAME: 'lordheb' }),
    });

    expect(result.mode).toBe('mock');
    expect(result.topicId).toBe('0.0.424242');
    expect(result.postcard.displayName).toBe('lordheb');
    expect(result.latestMessages).toHaveLength(3);
    expect(result.summary).toContain('HashTrail postcard');
  });

  test('declines mint requests when minting is disabled', async () => {
    const result = await runMockHashTrailAgent({
      input: 'mint the tiny fun token',
      env: loadEnv({ WEEK1_ALLOW_MINT: 'false' }),
    });

    expect(result.status).toBe('denied');
    expect(result.summary).toContain('mint-not-allowed');
  });
});
