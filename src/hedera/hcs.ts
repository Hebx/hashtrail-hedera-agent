import type { HashTrailPostcard } from '../shared/types.js';

export type HcsReceipt = {
  topicId: string;
  transactionId?: string;
  sequenceNumber?: number;
};

export type HcsLiveBoundary = {
  ensureTopic: () => Promise<string>;
  submitPostcard: (postcard: HashTrailPostcard) => Promise<HcsReceipt>;
  readLatest: (topicId: string, limit: number) => Promise<HashTrailPostcard[]>;
};

export function createUnimplementedHcsBoundary(): HcsLiveBoundary {
  return {
    ensureTopic: async () => {
      throw new Error('Live HCS topic creation is not enabled in mock mode');
    },
    submitPostcard: async () => {
      throw new Error('Live HCS submission is not enabled in mock mode');
    },
    readLatest: async () => {
      throw new Error('Live HCS query is not enabled in mock mode');
    },
  };
}
