import { describe, expect, test } from "vitest";

import {
  buildHashScanLinks,
  hashScanTopicUrl,
  hashScanTransactionUrl,
} from "../src/hedera/hashscan.js";

describe("HashScan link helpers", () => {
  test("builds stable testnet topic and transaction links", () => {
    expect(hashScanTopicUrl("0.0.9004997")).toBe(
      "https://hashscan.io/testnet/topic/0.0.9004997",
    );
    expect(hashScanTransactionUrl("0.0.7304745@1779208518.317505415")).toBe(
      "https://hashscan.io/testnet/tx/0.0.7304745@1779208518.317505415",
    );
  });

  test("builds links from a HashTrail result", () => {
    const links = buildHashScanLinks({
      accountId: "0.0.7304745",
      topicId: "0.0.9004997",
      hcsTransactionId: "0.0.7304745@1779207335.097879043",
      htsMint: {
        tokenId: "0.0.9005160",
        amount: 1,
        transactionId: "0.0.7304745@1779208518.317505415",
      },
    });

    expect(links.account).toBe(
      "https://hashscan.io/testnet/account/0.0.7304745",
    );
    expect(links.topic).toBe("https://hashscan.io/testnet/topic/0.0.9004997");
    expect(links.token).toBe("https://hashscan.io/testnet/token/0.0.9005160");
    expect(links.htsMintTransaction).toBe(
      "https://hashscan.io/testnet/tx/0.0.7304745@1779208518.317505415",
    );
  });
});
