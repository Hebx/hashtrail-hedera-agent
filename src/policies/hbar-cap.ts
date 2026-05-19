import { POLICY_ALLOWED, PolicyDeniedError } from './policy-error.js';

const AMOUNT_KEY_PATTERN = /(^amount$|hbar|hbars|tinybar|tinybars)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function findLargestHbarAmount(value: unknown): number | null {
  if (!isRecord(value)) {
    return null;
  }

  let largest: number | null = null;
  for (const [key, child] of Object.entries(value)) {
    if (AMOUNT_KEY_PATTERN.test(key)) {
      const amount = toNumber(child);
      if (amount !== null) {
        largest = largest === null ? amount : Math.max(largest, amount);
      }
    }

    const nested = findLargestHbarAmount(child);
    if (nested !== null) {
      largest = largest === null ? nested : Math.max(largest, nested);
    }
  }

  return largest;
}

export function enforceHbarCap(normalizedParams: unknown): { allowed: true } {
  const largestAmount = findLargestHbarAmount(normalizedParams);
  if (largestAmount !== null && largestAmount > 1) {
    throw new PolicyDeniedError('hbar-cap-exceeded', 'hbar-cap-v1');
  }

  return POLICY_ALLOWED;
}

export const hbarCapPolicy = {
  name: 'hashtrail-hbar-cap',
  stage: 'Post-Parameter Normalization',
  enforce: enforceHbarCap,
} as const;
