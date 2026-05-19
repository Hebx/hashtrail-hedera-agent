import { describe, expect, test } from 'vitest';

import { enforceHbarCap } from '../../src/policies/hbar-cap.js';

describe('enforceHbarCap', () => {
  test('denies HBAR amounts above one', () => {
    expect(() => enforceHbarCap({ amount: 1.01 })).toThrow(
      /hbar-cap-exceeded/,
    );
  });

  test('allows one HBAR or less', () => {
    expect(enforceHbarCap({ amount: 1 })).toEqual({ allowed: true });
    expect(enforceHbarCap({ amount: 0.25 })).toEqual({ allowed: true });
  });

  test('finds nested HBAR amount fields', () => {
    expect(() =>
      enforceHbarCap({ transfer: { hbarAmount: '2' } }),
    ).toThrow(/hbar-cap-exceeded/);
  });
});
