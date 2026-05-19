import { describe, expect, test } from "vitest";

import { enforceMintAllowlist } from "../../src/policies/allowlist.js";

describe("enforceMintAllowlist", () => {
  test("denies mint-like tools when minting is disabled", () => {
    expect(() =>
      enforceMintAllowlist({ toolName: "tokenMint", allowMint: false }),
    ).toThrow(/mint-not-allowed/);
  });

  test("allows mint-like tools when minting is enabled", () => {
    expect(
      enforceMintAllowlist({ toolName: "tokenCreate", allowMint: true }),
    ).toEqual({ allowed: true });
  });

  test("allows unrelated tools when minting is disabled", () => {
    expect(
      enforceMintAllowlist({
        toolName: "consensusSubmitMessage",
        allowMint: false,
      }),
    ).toEqual({ allowed: true });
  });
});
