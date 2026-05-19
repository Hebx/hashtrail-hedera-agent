#!/usr/bin/env node
import { runHashTrailAgent } from "./agent/hashtrail-agent.js";
import { buildHashScanLinks } from "./hedera/hashscan.js";
import { loadEnv } from "./shared/env.js";

const input = process.argv.slice(2).join(" ") || "make me a hashtrail postcard";
const env = loadEnv();
const result = await runHashTrailAgent({ input, env });

console.log(`HashTrail status=${result.status} mode=${result.mode}`);
console.log(`balance=${result.balance}`);
console.log(`topicId=${result.topicId}`);
console.log(`postcard=${JSON.stringify(result.postcard)}`);
console.log("latest messages:");
for (const [index, message] of result.latestMessages.entries()) {
  console.log(`${index + 1}. ${message.message}`);
}
console.log(result.summary);

const hashScanLinks = buildHashScanLinks({
  accountId: env.hederaOperatorId,
  topicId: result.topicId,
  hcsTransactionId: result.hcsReceipt?.transactionId,
  htsMint: result.htsMint,
});
if (Object.keys(hashScanLinks).length > 0) {
  console.log("hashscan:");
  for (const [label, url] of Object.entries(hashScanLinks)) {
    console.log(`${label}=${url}`);
  }
}

if (result.status === "denied") {
  process.exitCode = 2;
}
