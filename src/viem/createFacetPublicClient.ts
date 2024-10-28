import { createPublicClient, http } from "viem";

import { facetSepolia } from "../chains";

export const createFacetPublicClient = (l1ChainId: 1 | 11_155_111) => {
  if (l1ChainId === 1) {
    throw new Error("Facet is not on mainnet");
  }
  return createPublicClient({
    chain: facetSepolia,
    transport: http(),
  });
};
