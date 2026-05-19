#!/usr/bin/env node
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import {
  hashScanAccountUrl,
  hashScanTokenUrl,
  hashScanTopicUrl,
  hashScanTransactionUrl,
} from "./hedera/hashscan.js";
import { loadEnv } from "./shared/env.js";

const execFileAsync = promisify(execFile);

export type DemoTranscriptCommand = {
  command: string;
  output: string;
};

export type DemoTranscriptInput = {
  generatedAt: string;
  accountId?: string;
  commands: DemoTranscriptCommand[];
  topicId?: string;
  tokenId?: string;
  tipNftTokenId?: string;
  hcsTransactionId?: string;
  htsTransactionId?: string;
  tipHbarTransactionId?: string;
  tipNftTransferTransactionId?: string;
};

const TRANSCRIPT_PATH = "submission/demo-testnet-transcript.md";

export function buildDemoTranscript(input: DemoTranscriptInput): string {
  const links = [
    input.accountId
      ? `- Account: ${hashScanAccountUrl(input.accountId)}`
      : undefined,
    input.topicId
      ? `- HCS topic: ${hashScanTopicUrl(input.topicId)}`
      : undefined,
    input.tokenId
      ? `- HTS token: ${hashScanTokenUrl(input.tokenId)}`
      : undefined,
    input.tipNftTokenId
      ? `- Tip Card NFT: ${hashScanTokenUrl(input.tipNftTokenId)}`
      : undefined,
    input.hcsTransactionId
      ? `- HCS transaction: ${hashScanTransactionUrl(input.hcsTransactionId)}`
      : undefined,
    input.htsTransactionId
      ? `- HTS mint transaction: ${hashScanTransactionUrl(input.htsTransactionId)}`
      : undefined,
    input.tipHbarTransactionId
      ? `- Tip HBAR transaction: ${hashScanTransactionUrl(input.tipHbarTransactionId)}`
      : undefined,
    input.tipNftTransferTransactionId
      ? `- Tip NFT transfer transaction: ${hashScanTransactionUrl(input.tipNftTransferTransactionId)}`
      : undefined,
  ].filter((line): line is string => Boolean(line));

  const commandBlocks = input.commands
    .map(
      (entry, index) => `## ${index + 1}. ${entry.command}

\`\`\`bash
${entry.command}
\`\`\`

\`\`\`text
${entry.output.trim()}
\`\`\``,
    )
    .join("\n\n");

  return `# HashTrail live testnet demo transcript

Generated: ${input.generatedAt}

## HashScan links

${links.join("\n")}

${commandBlocks}
`;
}

async function runCommand(args: string[]): Promise<DemoTranscriptCommand> {
  const quoted = args
    .map((arg) => (arg.includes(" ") ? `"${arg}"` : arg))
    .join(" ");
  const command = `npm run hashtrail -- ${quoted}`;
  const { stdout, stderr } = await execFileAsync(
    "npm",
    ["run", "hashtrail", "--", ...args],
    {
      env: process.env,
      maxBuffer: 1024 * 1024,
    },
  );

  return {
    command,
    output: `${stdout}${stderr}`.trim(),
  };
}

function findFirst(pattern: RegExp, text: string): string | undefined {
  return text.match(pattern)?.[1];
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (env.mode !== "live") {
    throw new Error("demo transcript requires HBL_LIVE=1");
  }

  const commands = [
    await runCommand(["make me a hashtrail receipt"]),
    await runCommand(["mint the tiny fun token"]),
    await runCommand(["check my balance and read the last 3 postcards"]),
    await runCommand(["tip 0.25 hbar to alice for shipping the demo"]),
  ];
  const allOutput = commands.map((entry) => entry.output).join("\n");
  const hcsOutput = commands[0]?.output ?? "";
  const htsOutput = commands[1]?.output ?? "";
  const tipOutput = commands[3]?.output ?? "";
  const transcript = buildDemoTranscript({
    generatedAt: new Date().toISOString(),
    accountId: env.hederaOperatorId,
    commands,
    topicId: findFirst(/^topicId=(0\.0\.\d+)/m, allOutput) ?? env.hcsTopicId,
    tokenId: findFirst(/\btoken=(0\.0\.\d+)/, allOutput) ?? env.htsTokenId,
    tipNftTokenId:
      findFirst(/^tipNftToken=https:\/\/hashscan\.io\/testnet\/token\/(0\.0\.\d+)/m, tipOutput) ??
      env.nftTokenId,
    hcsTransactionId: findFirst(/\btx=([0-9.]+@[0-9.]+)/, hcsOutput),
    htsTransactionId: findFirst(/\btx=([0-9.]+@[0-9.]+)/, htsOutput),
    tipHbarTransactionId: findFirst(
      /^tipHbarTransaction=https:\/\/hashscan\.io\/testnet\/tx\/([0-9.]+@[0-9.]+)/m,
      tipOutput,
    ),
    tipNftTransferTransactionId: findFirst(
      /^tipNftTransferTransaction=https:\/\/hashscan\.io\/testnet\/tx\/([0-9.]+@[0-9.]+)/m,
      tipOutput,
    ),
  });

  await writeFile(TRANSCRIPT_PATH, transcript);
  console.log(`Wrote ${TRANSCRIPT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
