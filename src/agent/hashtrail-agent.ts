import { runMockHashTrailAgent } from './mock-hashtrail-agent.js';
import type { HashTrailEnv, HashTrailResult } from '../shared/types.js';

export async function runHashTrailAgent(input: {
  input: string;
  env: HashTrailEnv;
}): Promise<HashTrailResult> {
  if (input.env.mode === 'mock') {
    return runMockHashTrailAgent(input);
  }

  throw new Error(
    'Live mode boundary is configured, but live network execution is intentionally guarded. Use HBL_LIVE=0 for the verified demo path until credentials are added.',
  );
}
