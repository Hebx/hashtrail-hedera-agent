import {
  AbstractHook,
  AbstractPolicy,
  AgentMode,
  type Configuration,
  type Plugin,
  type PostParamsNormalizationParams,
  type PostSecondaryActionParams,
  type PreToolExecutionParams,
} from "@hashgraph/hedera-agent-kit";
import { HederaLangchainToolkit } from "@hashgraph/hedera-agent-kit-langchain";
import {
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
  coreMiscQueriesPlugin,
  coreTokenPlugin,
  coreTokenPluginToolNames,
  coreTokenQueryPlugin,
  coreTransactionQueryPlugin,
  TRANSFER_HBAR_TOOL,
  TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
} from "@hashgraph/hedera-agent-kit/plugins";
import { ChatGoogle } from "@langchain/google";
import { ChatOpenAI } from "@langchain/openai";
import type { Client } from "@hiero-ledger/sdk";

import { makeAuditLogLine } from "../policies/audit-log.js";
import { enforceHbarCap } from "../policies/hbar-cap.js";
import { enforceMintAllowlist } from "../policies/allowlist.js";
import type { HashTrailEnv } from "../shared/types.js";

export const hashTrailPlugins: Plugin[] = [
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
  coreTokenPlugin,
  coreTokenQueryPlugin,
  coreTransactionQueryPlugin,
  coreMiscQueriesPlugin,
];

class HashTrailMintAllowlistPolicy extends AbstractPolicy {
  name = "HashTrail Mint Allowlist Policy";
  description = "Denies token create/mint tools unless WEEK1_ALLOW_MINT=true.";
  relevantTools = [
    coreTokenPluginToolNames.CREATE_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.MINT_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.CREATE_NON_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.MINT_NON_FUNGIBLE_TOKEN_TOOL,
  ];

  constructor(private readonly allowMint: boolean) {
    super();
  }

  protected override shouldBlockPreToolExecution(
    _params: PreToolExecutionParams,
    method: string,
  ): boolean {
    try {
      enforceMintAllowlist({ toolName: method, allowMint: this.allowMint });
      return false;
    } catch {
      return true;
    }
  }
}

class HashTrailHbarCapPolicy extends AbstractPolicy {
  name = "HashTrail HBAR Cap Policy";
  description = "Denies normalized HBAR amounts above one HBAR.";
  relevantTools = [TRANSFER_HBAR_TOOL, TRANSFER_HBAR_WITH_ALLOWANCE_TOOL];

  protected override shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
  ): boolean {
    try {
      enforceHbarCap(params.normalisedParams);
      return false;
    } catch {
      return true;
    }
  }
}

class HashTrailAuditLogHook extends AbstractHook {
  name = "HashTrail Audit Log Hook";
  description = "Emits a structured JSON audit line after tool execution.";
  relevantTools = [
    TRANSFER_HBAR_TOOL,
    TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
    coreTokenPluginToolNames.CREATE_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.MINT_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.CREATE_NON_FUNGIBLE_TOKEN_TOOL,
    coreTokenPluginToolNames.MINT_NON_FUNGIBLE_TOKEN_TOOL,
  ];

  override async postToolExecutionHook(
    params: PostSecondaryActionParams,
    method: string,
  ): Promise<void> {
    process.stdout.write(
      `${makeAuditLogLine({
        correlationId: `${method}-${Date.now()}`,
        tool: method,
        status: "ok",
        txId: extractTransactionId(params.toolResult),
      })}\n`,
    );
  }
}

function extractTransactionId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const match = value.match(/\b\d+\.\d+\.\d+@\d+\.\d+\b/);
    return match?.[0];
  }

  if (typeof value === "object" && value !== null && "transactionId" in value) {
    const tx = (value as { transactionId?: unknown }).transactionId;
    return typeof tx === "string" ? tx : undefined;
  }

  return undefined;
}

export function buildHashTrailHakConfiguration(
  env: HashTrailEnv,
): Configuration {
  return {
    plugins: hashTrailPlugins,
    context: {
      mode: AgentMode.AUTONOMOUS,
      hooks: [
        new HashTrailMintAllowlistPolicy(env.allowMint),
        new HashTrailHbarCapPolicy(),
        new HashTrailAuditLogHook(),
      ],
    },
  };
}

export function buildHashTrailToolkit(input: {
  client: Client;
  env: HashTrailEnv;
}): HederaLangchainToolkit {
  return new HederaLangchainToolkit({
    client: input.client,
    configuration: buildHashTrailHakConfiguration(input.env),
  });
}

export function buildHashTrailChatModel(
  env: HashTrailEnv,
): ChatGoogle | ChatOpenAI | null {
  if (env.llmProvider === "none") {
    return null;
  }

  if (env.llmProvider === "gemini") {
    return new ChatGoogle(env.llmModel, {
      apiKey: env.geminiApiKey,
      temperature: 0,
    });
  }

  if (env.llmProvider === "openai") {
    return new ChatOpenAI({
      model: env.llmModel,
      apiKey: env.openAiApiKey,
      temperature: 0,
    });
  }

  throw new Error(`Unsupported HBL_LLM_PROVIDER=${env.llmProvider}`);
}
