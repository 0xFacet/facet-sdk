import { createPublicClient, http } from "viem";

import { facetMainnet, facetSepolia } from "../chains";

export const createFacetPublicClient = (l1ChainId: 1 | 11_155_111) =>
  createPublicClient({
    chain: l1ChainId === 1 ? facetMainnet : facetSepolia,
    transport: http(),
  });
