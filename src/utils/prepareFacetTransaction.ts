import { concatHex, toBytes, toHex, toRlp } from "viem";

import { FacetPublicClient, FacetTransactionParams } from "../types";
import { calculateInputCost } from "./calculateInputCost";
import { decodeAttributes } from "./decodeAttributes";

export const prepareFacetTransaction = async (
  facetPublicClient: FacetPublicClient,
  fromAddress: `0x${string}`,
  params: FacetTransactionParams
) => {
  const { to, value, data, extraData } = params;

  if (!facetPublicClient.chain) {
    throw new Error("Facet chain not found");
  }

  const [estimateFeesPerGas, estimateGas, latestBlock] = await Promise.all([
    facetPublicClient.estimateFeesPerGas({
      type: "eip1559",
      chain: facetPublicClient.chain,
    }),
    facetPublicClient.estimateGas({
      account: fromAddress,
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

  if (!estimateFeesPerGas?.maxFeePerGas) {
    throw new Error("Max fee per gas estimate not found");
  }

  const gasFeeCap = estimateFeesPerGas.maxFeePerGas;
  const gasLimit = estimateGas;

  const transactionData = [
    toHex(facetPublicClient.chain.id), // L2 chain id
    to ?? "0x", // L2 recipient address
    value ? toHex(value) : "0x", // L2 value
    gasFeeCap ? toHex(gasFeeCap) : "0x", // Max fee per gas estimate
    gasLimit ? toHex(gasLimit) : "0x", // Estimated gas limit
    data ?? "0x", // L2 transaction data
  ];

  // Extra data to mine more
  if (extraData) transactionData.push(extraData);

  const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

  const inputCost = calculateInputCost(toBytes(encodedTransaction));
  const mintAmount = inputCost * fctMintRate;

  return {
    values: {
      mintAmount,
      maxFeePerGas: estimateFeesPerGas.maxFeePerGas,
      gasLimit: estimateGas,
    },
    encodedTransaction,
  };
};
