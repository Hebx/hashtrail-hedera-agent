import "dotenv/config";

import type { HashTrailEnv } from "./types.js";

type EnvInput = Record<string, string | undefined>;

const PLACEHOLDER_VALUES = new Set(["", "REPLACE_ME", "0.0.xxxxx"]);

function read(
  input: EnvInput,
  key: string,
  includeProcessEnv: boolean,
): string | undefined {
  return input[key] ?? (includeProcessEnv ? process.env[key] : undefined);
}

function requireLiveValue(
  input: EnvInput,
  key: string,
  includeProcessEnv: boolean,
): string {
  const value = read(input, key, includeProcessEnv);
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    throw new Error(`${key} is required for Hedera testnet execution`);
  }
  return value;
}

function defaultModelFor(provider: string): string {
  if (provider === "gemini") {
    return "gemini-2.5-flash";
  }
  if (provider === "none") {
    return "none";
  }
  return "gpt-4o-mini";
}

export function loadEnv(input: EnvInput = process.env): HashTrailEnv {
  const includeProcessEnv = input === process.env;
  const network = read(input, "HEDERA_NETWORK", includeProcessEnv) ?? "testnet";
  if (network !== "testnet") {
    throw new Error(`HEDERA_NETWORK must be testnet, received ${network}`);
  }

  const llmProvider =
    read(input, "HBL_LLM_PROVIDER", includeProcessEnv) ?? "openai";

  requireLiveValue(input, "HEDERA_OPERATOR_ID", includeProcessEnv);
  requireLiveValue(input, "HEDERA_OPERATOR_KEY", includeProcessEnv);
  if (llmProvider === "openai") {
    requireLiveValue(input, "OPENAI_API_KEY", includeProcessEnv);
  }
  if (llmProvider === "gemini") {
    requireLiveValue(input, "GEMINI_API_KEY", includeProcessEnv);
  }

  return {
    hederaNetwork: "testnet",
    hederaOperatorId: read(input, "HEDERA_OPERATOR_ID", includeProcessEnv),
    hederaOperatorKey: read(input, "HEDERA_OPERATOR_KEY", includeProcessEnv),
    hederaMirrorNodeUrl: read(
      input,
      "HEDERA_MIRROR_NODE_URL",
      includeProcessEnv,
    ),
    llmProvider,
    llmModel:
      read(input, "HBL_LLM_MODEL", includeProcessEnv) ??
      defaultModelFor(llmProvider),
    openAiApiKey: read(input, "OPENAI_API_KEY", includeProcessEnv),
    geminiApiKey: read(input, "GEMINI_API_KEY", includeProcessEnv),
    displayName:
      read(input, "HASHTRAIL_DISPLAY_NAME", includeProcessEnv) ?? "ihab",
    hcsTopicId: read(input, "HASHTRAIL_HCS_TOPIC_ID", includeProcessEnv),
    htsTokenId: read(input, "HASHTRAIL_HTS_TOKEN_ID", includeProcessEnv),
    nftTokenId: read(input, "HASHTRAIL_NFT_TOKEN_ID", includeProcessEnv),
    allowMint: read(input, "WEEK1_ALLOW_MINT", includeProcessEnv) === "true",
    allowTip: read(input, "WEEK1_ALLOW_TIP", includeProcessEnv) === "true",
    allowTipNft:
      read(input, "WEEK1_ALLOW_TIP_NFT", includeProcessEnv) === "true",
  };
}
