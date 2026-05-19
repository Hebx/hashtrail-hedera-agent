export type PolicyErrorCode = 'policy-denied';

export class PolicyDeniedError extends Error {
  readonly code: PolicyErrorCode = 'policy-denied';
  readonly reason: string;
  readonly reasonHash: string;

  constructor(reason: string, reasonHash: string) {
    super(`policy-denied:${reason}`);
    this.name = 'PolicyDeniedError';
    this.reason = reason;
    this.reasonHash = reasonHash;
  }

  toJSON(): { code: PolicyErrorCode; reason: string; reasonHash: string } {
    return {
      code: this.code,
      reason: this.reason,
      reasonHash: this.reasonHash,
    };
  }
}

export type PolicyAllowed = {
  allowed: true;
};

export const POLICY_ALLOWED: PolicyAllowed = { allowed: true };
