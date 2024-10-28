import { Account, concatHex, PublicClient, toBytes, toHex, toRlp } from "viem";

import { FacetTransactionParams } from "../types";
import { calculateInputCost } from "./calculateInputCost";
import { decodeAttributes } from "./decodeAttributes";

export const prepareFacetTransaction = async (
  facetPublicClient: PublicClient,
  account: Account,
  params: FacetTransactionParams
) => {
  const { to, value = 0n, data = "0x" } = params;

  const [estimateFeesPerGas, estimateGas, latestBlock] = await Promise.all([
    facetPublicClient.estimateFeesPerGas({
      type: "eip1559",
      chain: facetPublicClient.chain,
    }),
    facetPublicClient.estimateGas({
      account: account.address,
      to,
      value,
      data,
    }),
    facetPublicClient.getBlock(),
  ]);

  const latestTransaction = await facetPublicClient.getTransaction({
    hash: latestBlock.transactions[0],
  });
  const attributes = decodeAttributes(latestTransaction.input);
  const { fctMintRate } = attributes;

  const inputCost = calculateInputCost(toBytes(data));
  const mintAmount = inputCost * fctMintRate;

  const rlpEncodedTransaction = toRlp([
    to, // L2 recipient address
    toHex(value), // L2 value
    toHex(estimateFeesPerGas?.maxFeePerGas || 0n), // Max fee per gas estimate
    toHex(estimateGas), // Estimated gas limit
    data, // L2 transaction data
    toHex(mintAmount), // Calculated mint amount
  ]);

  return {
    values: {
      mintAmount,
      maxFeePerGas: estimateFeesPerGas?.maxFeePerGas,
      gasLimit: estimateGas,
    },
    encodedTransaction: concatHex([toHex(70), rlpEncodedTransaction]),
  };
};
