import { createAgent } from "langchain";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { Client } from "@hiero-ledger/sdk";
import { ResponseParserService } from "@hashgraph/hedera-agent-kit-langchain";

import {
  buildHashTrailChatModel,
  buildHashTrailToolkit,
} from "../hedera/agent-kit.js";
import { HASHTRAIL_SYSTEM_PROMPT } from "./prompt.js";
import type { AgentToolCall, HashTrailEnv } from "../shared/types.js";

export const FREE_FORM_READ_ONLY_PREFIX =
  "You are running in read-only HashTrail Q&A mode. You may call query tools (HBAR balance, account info, topic info, topic messages, token info, transaction record, exchange rate) but MUST NOT call any tool that creates, mints, transfers, updates, or deletes accounts, tokens, topics, or HBAR. If the user asks for a write action, explain that they should use the deterministic command (for example: 'tip 0.25 hbar to alice', 'register alice as 0.0.x', or 'mint the tiny fun token'). Always answer with concrete account ids, topic ids, transaction ids, or HCS sequence numbers when you have them.";

const READ_TOOL_PATTERN = /^get_/;

export type FreeFormAgentOutput = {
  answer: string;
  toolCalls: AgentToolCall[];
};

export type FreeFormAgentBoundary = {
  answer: (input: string) => Promise<FreeFormAgentOutput>;
};

export function createFreeFormAgent(input: {
  client: Client;
  env: HashTrailEnv;
  topicId?: string;
}): FreeFormAgentBoundary | null {
  const model = buildHashTrailChatModel(input.env);
  if (!model) {
    return null;
  }

  const toolkit = buildHashTrailToolkit({
    client: input.client,
    env: input.env,
  });
  const allTools = toolkit.getTools();
  const readOnlyTools = allTools.filter((tool) =>
    READ_TOOL_PATTERN.test(tool.name),
  );

  if (readOnlyTools.length === 0) {
    throw new Error(
      "HashTrail free-form agent requires at least one read-only Hedera Agent Kit tool",
    );
  }

  const contextPreamble = buildContextPreamble({
    env: input.env,
    topicId: input.topicId,
  });
  const systemPrompt = `${HASHTRAIL_SYSTEM_PROMPT}\n\n${FREE_FORM_READ_ONLY_PREFIX}\n\n${contextPreamble}`;

  const agent = createAgent({
    model,
    tools: readOnlyTools as unknown as StructuredToolInterface[],
    systemPrompt,
  });
  const parser = new ResponseParserService(readOnlyTools);

  return {
    answer: async (userInput: string) => {
      const response = (await agent.invoke({
        messages: [{ role: "user", content: userInput }],
      })) as { messages: unknown[] };
      const parsed = parser.parseNewToolMessages(
        response as Parameters<ResponseParserService["parseNewToolMessages"]>[0],
      );
      const toolCalls: AgentToolCall[] = parsed
        .map((entry) => ({
          tool: typeof entry.toolName === "string" ? entry.toolName : "unknown",
          transactionId: extractTransactionId(entry.parsedData),
        }))
        .filter((entry) => entry.tool !== "unknown");

      const last = response.messages.at(-1);
      const answer = extractMessageText(last) ?? "";

      return { answer, toolCalls };
    },
  };
}

function buildContextPreamble(input: {
  env: HashTrailEnv;
  topicId?: string;
}): string {
  const parts: string[] = [
    `Hedera network: ${input.env.hederaNetwork}.`,
  ];
  if (input.env.hederaOperatorId) {
    parts.push(`Operator account: ${input.env.hederaOperatorId}.`);
  }
  if (input.topicId) {
    parts.push(`Default HashTrail HCS topic: ${input.topicId}.`);
  }
  if (input.env.htsTokenId) {
    parts.push(`HashTrail fun token: ${input.env.htsTokenId}.`);
  }
  if (input.env.nftTokenId) {
    parts.push(`HashTrail Tip Card NFT collection: ${input.env.nftTokenId}.`);
  }
  return parts.join(" ");
}

function extractMessageText(message: unknown): string | undefined {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textChunks = content
      .map((chunk) => {
        if (typeof chunk === "string") {
          return chunk;
        }
        if (
          chunk &&
          typeof chunk === "object" &&
          "text" in chunk &&
          typeof (chunk as { text: unknown }).text === "string"
        ) {
          return (chunk as { text: string }).text;
        }
        return "";
      })
      .filter((value) => value.length > 0);
    if (textChunks.length > 0) {
      return textChunks.join("");
    }
  }

  return undefined;
}

function extractTransactionId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const match = value.match(/\b\d+\.\d+\.\d+@\d+\.\d+\b/);
    return match?.[0];
  }
  if (typeof value === "object" && value !== null) {
    const tx = (value as { transactionId?: unknown }).transactionId;
    if (typeof tx === "string") {
      return tx;
    }
  }
  return undefined;
}
