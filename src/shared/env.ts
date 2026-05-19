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
    throw new Error(`${key} is required when HBL_LIVE=1`);
  }
  return value;
}

export function loadEnv(input: EnvInput = process.env): HashTrailEnv {
  const includeProcessEnv = input === process.env;
  const network = read(input, "HEDERA_NETWORK", includeProcessEnv) ?? "testnet";
  if (network !== "testnet") {
    throw new Error(`HEDERA_NETWORK must be testnet, received ${network}`);
  }

  const mode =
    read(input, "HBL_LIVE", includeProcessEnv) === "1" ? "live" : "mock";
  const llmProvider =
    read(input, "HBL_LLM_PROVIDER", includeProcessEnv) ?? "openai";

  if (mode === "live") {
    requireLiveValue(input, "HEDERA_OPERATOR_ID", includeProcessEnv);
    requireLiveValue(input, "HEDERA_OPERATOR_KEY", includeProcessEnv);
    if (llmProvider === "openai") {
      requireLiveValue(input, "OPENAI_API_KEY", includeProcessEnv);
    }
  }

  return {
    mode,
    hederaNetwork: "testnet",
    hederaOperatorId: read(input, "HEDERA_OPERATOR_ID", includeProcessEnv),
    hederaOperatorKey: read(input, "HEDERA_OPERATOR_KEY", includeProcessEnv),
    hederaMirrorNodeUrl: read(
      input,
      "HEDERA_MIRROR_NODE_URL",
      includeProcessEnv,
    ),
    llmProvider,
    llmModel: read(input, "HBL_LLM_MODEL", includeProcessEnv) ?? "gpt-4o-mini",
    openAiApiKey: read(input, "OPENAI_API_KEY", includeProcessEnv),
    displayName:
      read(input, "HASHTRAIL_DISPLAY_NAME", includeProcessEnv) ?? "ihab",
    hcsTopicId: read(input, "HASHTRAIL_HCS_TOPIC_ID", includeProcessEnv),
    htsTokenId: read(input, "HASHTRAIL_HTS_TOKEN_ID", includeProcessEnv),
    allowMint: read(input, "WEEK1_ALLOW_MINT", includeProcessEnv) === "true",
  };
}
