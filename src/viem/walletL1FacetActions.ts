import { WalletClient } from "viem";

import { FacetTransactionParams } from "../types";
import { sendFacetTransaction } from "./sendFacetTransaction";

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
  sendFacetTransaction: (params: FacetTransactionParams) =>
    sendFacetTransaction(l1WalletClient, params),
});
