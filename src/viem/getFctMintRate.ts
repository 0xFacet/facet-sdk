import { Chain } from "viem";
import { createFacetPublicClient } from "./createFacetPublicClient";

const L1_BLOCK_CONTRACT =
  "0x4200000000000000000000000000000000000015" as `0x${string}`;

export const getFctMintRate = async (chain: Chain) => {
  const facetPublicClient = createFacetPublicClient(chain);

  const fctMintRate = await facetPublicClient.readContract({
    address: L1_BLOCK_CONTRACT,
    abi: [
      {
        inputs: [],
        name: "fctMintRate",
        outputs: [
          {
            internalType: "uint128",
            name: "",
            type: "uint128",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "fctMintRate",
  });

  return fctMintRate;
};
