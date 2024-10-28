import { Account, concatHex, PublicClient, toBytes, toHex, toRlp } from "viem";

import { FacetTransactionParams } from "../types";
import { calculateInputCost } from "./calculateInputCost";
import { decodeAttributes } from "./decodeAttributes";

export const prepareFacetTransaction = async (
  facetPublicClient: PublicClient,
  account: Account,
  params: FacetTransactionParams
) => {
  const { to, value = 0n, data = "0x", extraData } = params;

  if (!facetPublicClient.chain) {
    throw new Error("Facet chain not found");
  }

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

  const transactionData = [
    toHex(facetPublicClient.chain.id), // L2 chain id
    to, // L2 recipient address
    toHex(value), // L2 value
    toHex(estimateFeesPerGas?.maxFeePerGas || 0n), // Max fee per gas estimate
    toHex(estimateGas), // Estimated gas limit
    data, // L2 transaction data
  ];

  // Extra data to mine more
  if (extraData) transactionData.push(extraData);

  const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

  const inputCost = calculateInputCost(toBytes(encodedTransaction));
  const mintAmount = inputCost * fctMintRate;

  return {
    values: {
      mintAmount,
      maxFeePerGas: estimateFeesPerGas?.maxFeePerGas,
      gasLimit: estimateGas,
    },
    encodedTransaction,
  };
};
