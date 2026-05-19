import { POLICY_ALLOWED, PolicyDeniedError } from "./policy-error.js";

const MINT_TOOL_PATTERN = /token.*(create|mint)|(create|mint).*token/i;

export function enforceMintAllowlist(input: {
  toolName: string;
  allowMint: boolean;
}): { allowed: true } {
  if (!input.allowMint && MINT_TOOL_PATTERN.test(input.toolName)) {
    throw new PolicyDeniedError("mint-not-allowed", "mint-not-allowed-v1");
  }

  return POLICY_ALLOWED;
}

export const mintAllowlistPolicy = {
  name: "hashtrail-mint-allowlist",
  stage: "Pre-Tool Execution",
  enforce: enforceMintAllowlist,
} as const;
