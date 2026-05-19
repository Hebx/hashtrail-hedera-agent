import { Hbar, TransferTransaction, type Client } from "@hiero-ledger/sdk";

import type { HashTrailEnv, HbarTransferReceipt } from "../shared/types.js";

export type TipLiveBoundary = {
  transferHbar: (
    recipientId: string,
    amountHbar: number,
  ) => Promise<HbarTransferReceipt>;
};

export function createLiveTipBoundary(input: {
  client: Client;
  env: HashTrailEnv;
}): TipLiveBoundary {
  return {
    transferHbar: async (recipientId, amountHbar) => {
      if (!input.env.hederaOperatorId) {
        throw new Error("HEDERA_OPERATOR_ID is required");
      }

      const response = await new TransferTransaction()
        .addHbarTransfer(input.env.hederaOperatorId, new Hbar(-amountHbar))
        .addHbarTransfer(recipientId, new Hbar(amountHbar))
        .execute(input.client);
      await response.getReceipt(input.client);

      return {
        from: input.env.hederaOperatorId,
        to: recipientId,
        amountHbar,
        transactionId: response.transactionId?.toString(),
      };
    },
  };
}
