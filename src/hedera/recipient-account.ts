import {
  AccountCreateTransaction,
  Hbar,
  PrivateKey,
  type Client,
} from "@hiero-ledger/sdk";

export type CreatedRecipientAccount = {
  alias: string;
  accountId: string;
  privateKey: string;
  publicKey: string;
  maxAutomaticTokenAssociations: number;
  initialBalanceHbar: number;
  transactionId?: string;
  createdAt: string;
};

export async function createRecipientAccount(input: {
  alias: string;
  client: Client;
  initialBalanceHbar?: number;
  maxAutomaticTokenAssociations?: number;
}): Promise<CreatedRecipientAccount> {
  const initialBalanceHbar = input.initialBalanceHbar ?? 1;
  const maxAutomaticTokenAssociations = input.maxAutomaticTokenAssociations ?? 10;
  const recipientKey = PrivateKey.generateECDSA();

  const response = await new AccountCreateTransaction()
    .setKey(recipientKey.publicKey)
    .setInitialBalance(new Hbar(initialBalanceHbar))
    .setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociations)
    .setAccountMemo(`HashTrail recipient ${input.alias}`)
    .execute(input.client);
  const receipt = await response.getReceipt(input.client);
  const accountId = receipt.accountId?.toString();
  if (!accountId) {
    throw new Error("Recipient account creation did not return an account id");
  }

  return {
    alias: input.alias,
    accountId,
    privateKey: recipientKey.toStringRaw(),
    publicKey: recipientKey.publicKey.toStringRaw(),
    maxAutomaticTokenAssociations,
    initialBalanceHbar,
    transactionId: response.transactionId?.toString(),
    createdAt: new Date().toISOString(),
  };
}
