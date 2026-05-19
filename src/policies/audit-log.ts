export type AuditLogInput = {
  correlationId: string;
  tool: string;
  status: "ok" | "denied" | "error";
  txId?: string;
  error?: string;
};

function sanitizeError(error: string | undefined): string | undefined {
  if (!error) {
    return undefined;
  }

  return error
    .replace(/private\s+key\s+\S+/gi, "private key [redacted]")
    .replace(/0x[a-f0-9]{32,}/gi, "[redacted-hex]");
}

export function makeAuditLogLine(input: AuditLogInput): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    correlationId: input.correlationId,
    tool: input.tool,
    status: input.status,
    txId: input.txId,
    error: sanitizeError(input.error),
  });
}

export const auditLogPolicy = {
  name: "hashtrail-audit-log",
  stage: "Post-Tool Execution",
  makeLine: makeAuditLogLine,
} as const;
