import type { RecipientRef } from "./recipients.js";

export const TIP_AMOUNT_CAP_HBAR = 5;

export type TipIntent =
  | {
      kind: "tip";
      amountHbar: number;
      recipient: RecipientRef;
      reason?: string;
    }
  | { kind: "invalid"; reason: TipParseError };

export type TipParseError = "amount-above-cap" | "amount-not-positive";

const TIP_REGEX =
  /^\s*tip\s+(\d+(?:\.\d+)?)\s*h(?:bar)?s?\s+to\s+([A-Za-z0-9_.@-]+)(?:\s+for\s+(.+?))?\s*$/i;

export function parseTipIntent(input: string): TipIntent | null {
  const match = input.match(TIP_REGEX);
  if (!match) {
    return null;
  }
  const [, amountStr, recipientRaw, reasonRaw] = match;
  const amountHbar = Number(amountStr);
  if (!Number.isFinite(amountHbar) || amountHbar <= 0) {
    return { kind: "invalid", reason: "amount-not-positive" };
  }
  if (amountHbar > TIP_AMOUNT_CAP_HBAR) {
    return { kind: "invalid", reason: "amount-above-cap" };
  }

  const recipient: RecipientRef = /^\d+\.\d+\.\d+$/.test(recipientRaw)
    ? { kind: "accountId", value: recipientRaw }
    : { kind: "alias", value: recipientRaw.toLowerCase() };

  return {
    kind: "tip",
    amountHbar,
    recipient,
    reason: cleanReason(reasonRaw),
  };
}

function cleanReason(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["'`]/, "").replace(/["'`]$/, "");
  return unquoted.length > 0 ? unquoted : undefined;
}
