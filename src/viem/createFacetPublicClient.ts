import { createPublicClient, http } from "viem";
import { publicActionsL2 } from "viem/op-stack";

import { facetSepolia } from "../chains";
import { FacetPublicClient } from "../types";

export const createFacetPublicClient = (
  l1ChainId: 1 | 11_155_111
): FacetPublicClient => {
  if (l1ChainId === 1) {
    throw new Error("Facet is not on mainnet");
  }
  return createPublicClient({
    chain: facetSepolia,
    transport: http(),
  }).extend(publicActionsL2());
};
