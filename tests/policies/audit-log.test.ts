import { describe, expect, test } from "vitest";

import { makeAuditLogLine } from "../../src/policies/audit-log.js";

describe("makeAuditLogLine", () => {
  test("returns one structured JSON line without key material", () => {
    const line = makeAuditLogLine({
      correlationId: "cid-1",
      tool: "consensusSubmitMessage",
      status: "ok",
      txId: "0.0.123@1.2",
      error: "private key abc should not leak",
    });

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      correlationId: "cid-1",
      tool: "consensusSubmitMessage",
      status: "ok",
      txId: "0.0.123@1.2",
    });
    expect(line).not.toContain("abc");
    expect(line.endsWith("\n")).toBe(false);
  });
});
