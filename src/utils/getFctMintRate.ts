import { L2_L1_BLOCK_CONTRACT } from "../constants/addresses";
import { createFacetPublicClient } from "../viem/createFacetPublicClient";

/**
 * Retrieves the current FCT mint rate from the L1 block contract.
 *
 * @param l1ChainId - The chain ID of the L1 network (1 for Ethereum mainnet, 11155111 for Sepolia testnet)
 * @returns A Promise that resolves to the current FCT mint rate as a bigint
 */
export const getFctMintRate = async (l1ChainId: 1 | 11155111) => {
  const facetPublicClient = createFacetPublicClient(l1ChainId);

  const fctMintRate = await facetPublicClient.readContract({
    address: L2_L1_BLOCK_CONTRACT,
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
