import { WalletClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

import { FacetTransactionParams } from "../types";
import { buildFacetTransaction } from "../utils";

/**
 * Creates a set of L1 facet actions bound to the provided wallet client
 * @param l1WalletClient - The viem wallet client for L1 interactions
 * @returns Object containing facet transaction functions
 */
export const walletL1FacetActions = (l1WalletClient: WalletClient) => ({
  /**
   * Sends a facet transaction using the L1 wallet client
   * @param params - Parameters for the facet transaction
   * @returns Result of the transaction
   */
  sendFacetTransaction: (params: FacetTransactionParams) => {
    if (!l1WalletClient.chain?.id) {
      throw new Error("No chain id");
    }
    if (!l1WalletClient.account?.address) {
      throw new Error("No connected account");
    }

    return buildFacetTransaction(
      l1WalletClient.chain.id,
      l1WalletClient.account.address,
      params,
      (l1Transaction) =>
        l1WalletClient.sendTransaction({
          ...l1Transaction,
          chain: l1Transaction.chainId === 1 ? mainnet : sepolia,
        })
    );
  },
});
