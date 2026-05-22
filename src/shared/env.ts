import "dotenv/config";

import type { HashTrailEnv, HederaNetwork } from "./types.js";

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
    throw new Error(`${key} is required for Hedera execution`);
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

function readTipCardMetadataUri(
  input: EnvInput,
  includeProcessEnv: boolean,
): string | undefined {
  const value = read(input, "HASHTRAIL_TIP_CARD_METADATA_URI", includeProcessEnv);
  if (!value) return undefined;

  const byteLength = Buffer.byteLength(value, "utf8");
  if (byteLength > 100) {
    throw new Error(
      `HASHTRAIL_TIP_CARD_METADATA_URI must fit Hedera NFT serial metadata (100 bytes max, received ${byteLength})`,
    );
  }
  if (!/^(ipfs|ar|https):\/\//.test(value)) {
    throw new Error(
      "HASHTRAIL_TIP_CARD_METADATA_URI must be an ipfs://, ar://, or https:// URI",
    );
  }

  return value;
}

export function loadEnv(input: EnvInput = process.env): HashTrailEnv {
  const includeProcessEnv = input === process.env;
  const network = read(input, "HEDERA_NETWORK", includeProcessEnv) ?? "testnet";
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error(`HEDERA_NETWORK must be testnet or mainnet, received ${network}`);
  }
  if (
    network === "mainnet" &&
    read(input, "HASHTRAIL_ENABLE_MAINNET", includeProcessEnv) !== "true"
  ) {
    throw new Error(
      "HEDERA_NETWORK=mainnet requires HASHTRAIL_ENABLE_MAINNET=true",
    );
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
    hederaNetwork: network as HederaNetwork,
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
    tipCardMetadataUri: readTipCardMetadataUri(input, includeProcessEnv),
    allowMint: read(input, "WEEK1_ALLOW_MINT", includeProcessEnv) === "true",
    allowTip: read(input, "WEEK1_ALLOW_TIP", includeProcessEnv) === "true",
    allowTipNft:
      read(input, "WEEK1_ALLOW_TIP_NFT", includeProcessEnv) === "true",
  };
}
