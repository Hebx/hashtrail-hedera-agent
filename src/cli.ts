#!/usr/bin/env node
import { runHashTrailAgent } from './agent/hashtrail-agent.js';
import { loadEnv } from './shared/env.js';

const input = process.argv.slice(2).join(' ') || 'make me a hashtrail postcard';
const env = loadEnv();
const result = await runHashTrailAgent({ input, env });

console.log(`HashTrail status=${result.status} mode=${result.mode}`);
console.log(`balance=${result.balance}`);
console.log(`topicId=${result.topicId}`);
console.log(`postcard=${JSON.stringify(result.postcard)}`);
console.log('latest messages:');
for (const [index, message] of result.latestMessages.entries()) {
  console.log(`${index + 1}. ${message.message}`);
}
console.log(result.summary);

if (result.status === 'denied') {
  process.exitCode = 2;
}
