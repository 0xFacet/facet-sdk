import { concatHex, toBytes, toHex, toRlp } from "viem";

import { FacetTransactionParams } from "../types";
import { calculateInputCost } from "./calculateInputCost";

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
