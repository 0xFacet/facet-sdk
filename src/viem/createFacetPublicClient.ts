import { createPublicClient, http, HttpTransport } from "viem";
import { publicActionsL2 } from "viem/op-stack";

import { FacetPublicClient } from "../types";
import { facetMainnet, facetSepolia } from "./chains";

/**
 * Creates a public client configured for the Facet network.
 *
 * @param l1ChainId - The L1 chain ID (1 for Ethereum mainnet, 11155111 for Sepolia testnet)
 * @param transport - Optional HTTP transport configuration
 * @returns A configured Facet public client with L2 actions
 * @throws Error if an invalid L1 chain ID is provided
 */
export const createFacetPublicClient = (
  l1ChainId: 1 | 11_155_111,
  transport?: HttpTransport
): FacetPublicClient => {
  if (l1ChainId !== 1 && l1ChainId !== 11_155_111) {
    throw Error("Invalid L1 chain ID");
  }
  return createPublicClient({
    chain: l1ChainId === 1 ? facetMainnet : facetSepolia,
    transport: transport ?? http(),
  }).extend(publicActionsL2());
};
