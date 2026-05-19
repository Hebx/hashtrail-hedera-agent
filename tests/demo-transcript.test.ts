import { describe, expect, test } from "vitest";

import { buildDemoTranscript } from "../src/demo-transcript.js";

describe("buildDemoTranscript", () => {
  test("renders a full submission-ready live transcript with HashScan links", () => {
    const markdown = buildDemoTranscript({
      generatedAt: "2026-05-19T19:30:00.000Z",
      accountId: "0.0.7304745",
      commands: [
        {
          command: 'npm run hashtrail -- "make me a hashtrail receipt"',
          output: "HashTrail status=ok mode=live\nHashTrail postcard posted",
        },
        {
          command: 'npm run hashtrail -- "mint the tiny fun token"',
          output: "HashTrail minted 1 HTFUN",
        },
      ],
      topicId: "0.0.9004997",
      tokenId: "0.0.9005160",
      tipNftTokenId: "0.0.9007634",
      hcsTransactionId: "0.0.7304745@1779207335.097879043",
      htsTransactionId: "0.0.7304745@1779208518.317505415",
      tipHbarTransactionId: "0.0.7304745@1779230290.741087103",
      tipNftTransferTransactionId: "0.0.7304745@1779230299.276104127",
    });

    expect(markdown).toContain("# HashTrail live testnet demo transcript");
    expect(markdown).toContain("https://hashscan.io/testnet/topic/0.0.9004997");
    expect(markdown).toContain("https://hashscan.io/testnet/token/0.0.9005160");
    expect(markdown).toContain(
      "https://hashscan.io/testnet/tx/0.0.7304745@1779208518.317505415",
    );
    expect(markdown).toContain("https://hashscan.io/testnet/token/0.0.9007634");
    expect(markdown).toContain(
      "https://hashscan.io/testnet/tx/0.0.7304745@1779230299.276104127",
    );
    expect(markdown).toContain("```bash\nnpm run hashtrail");
    expect(markdown).toContain("```text\nHashTrail status=ok mode=live");
  });
});
