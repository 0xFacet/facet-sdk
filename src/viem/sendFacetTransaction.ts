import { WalletClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

import { FacetTransactionParams } from "../types";
import { createFacetTransaction } from "../utils";

export const sendFacetTransaction = async (
  l1WalletClient: WalletClient,
  params: FacetTransactionParams
) => {
  if (!l1WalletClient.chain?.id) {
    throw new Error("No chain id");
  }
  if (!l1WalletClient.account?.address) {
    throw new Error("No connected account");
  }
  return createFacetTransaction(
    l1WalletClient.chain.id,
    l1WalletClient.account.address,
    params,
    (l1Transaction) =>
      l1WalletClient.sendTransaction({
        ...l1Transaction,
        chain: l1Transaction.chainId === 1 ? mainnet : sepolia,
      })
  );
};
