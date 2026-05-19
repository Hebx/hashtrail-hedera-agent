import { Client, PrivateKey } from "@hiero-ledger/sdk";

import type { HashTrailEnv } from "../shared/types.js";

export function parseOperatorPrivateKey(value: string): PrivateKey {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    return PrivateKey.fromStringECDSA(normalized);
  }

  if (PrivateKey.isDerKey(normalized)) {
    return PrivateKey.fromStringDer(normalized);
  }

  return PrivateKey.fromString(value);
}

export function buildHederaClient(env: HashTrailEnv): Client {
  if (env.hederaNetwork !== "testnet") {
    throw new Error("HashTrail only supports Hedera testnet");
  }

  if (env.mode !== "live") {
    throw new Error("Cannot create a Hedera client in mock mode");
  }

  if (!env.hederaOperatorId || !env.hederaOperatorKey) {
    throw new Error("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required");
  }

  const client = Client.forTestnet();
  client.setOperator(
    env.hederaOperatorId,
    parseOperatorPrivateKey(env.hederaOperatorKey),
  );
  return client;
}
