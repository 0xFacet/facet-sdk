import { concatHex, toBytes, toHex, toRlp } from "viem";

import { FacetTransactionParams } from "../types";
import { calculateInputCost } from "./calculateInputCost";

/**
 * Prepares a Facet transaction by encoding transaction data and calculating FCT mint amount.
 *
 * @param l2ChainId - The Layer 2 chain ID
 * @param fctMintRate - The FCT mint rate as a bigint
 * @param params - Transaction parameters including:
 *   - to: Destination address
 *   - value: Transaction value in wei
 *   - data: Transaction calldata
 *   - mineBoost: Optional mining boost parameter
 *   - gasLimit: Optional gas limit for the transaction
 * @returns An object containing:
 *   - fctMintAmount: The amount of FCT to mint based on input cost
 *   - encodedTransaction: The RLP-encoded transaction data
 */
export const prepareFacetTransaction = async (
  l2ChainId: number,
  fctMintRate: bigint,
  params: FacetTransactionParams & {
    gasLimit: bigint | undefined;
  }
) => {
  const { to, value, data, mineBoost, gasLimit } = params;

  const transactionData = [
    toHex(l2ChainId),
    to ?? "0x",
    value ? toHex(value) : "0x",
    gasLimit ? toHex(gasLimit) : "0x",
    data ?? "0x",
    mineBoost ?? "0x",
  ];

  const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

  const inputCost = calculateInputCost(toBytes(encodedTransaction));
  const fctMintAmount = inputCost * fctMintRate;

  return {
    fctMintAmount,
    encodedTransaction,
  };
};
