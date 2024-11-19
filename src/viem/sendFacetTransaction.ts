import { WalletClient } from "viem";

import { FacetTransactionParams } from "../types";
import { computeFacetTransactionHash } from "../utils/computeFacetTransactionHash";
import { prepareFacetTransaction } from "../utils/prepareFacetTransaction";
import { createFacetPublicClient } from "./createFacetPublicClient";
import { getFctMintRate } from "./getFctMintRate";

const FACET_INBOX_ADDRESS =
  "0x00000000000000000000000000000000000FacE7" as const;

export const sendFacetTransaction = async (
  l1WalletClient: WalletClient,
  params: FacetTransactionParams
) => {
  if (
    // l1WalletClient.chain?.id !== 1 &&
    l1WalletClient.chain?.id !== 11_155_111
  ) {
    throw new Error("Invalid L1 chain");
  }

  if (!l1WalletClient.account) {
    throw new Error("No account");
  }

  const facetPublicClient = createFacetPublicClient(l1WalletClient.chain.id);

  if (!facetPublicClient.chain) {
    throw new Error("L2 chain not configured");
  }

  const [estimateFeesPerGasRes, estimateGasRes, fctMintRate] =
    await Promise.all([
      facetPublicClient.estimateFeesPerGas({
        type: "eip1559",
        chain: facetPublicClient.chain,
      }),
      facetPublicClient.estimateGas({
        account: l1WalletClient.account,
        to: params.to,
        value: params.value,
        data: params.data,
      }),
      getFctMintRate(l1WalletClient.chain.id),
    ]);

  if (!estimateFeesPerGasRes?.maxFeePerGas) {
    throw new Error("Max fee per gas estimate not found");
  }

  const { maxFeePerGas } = estimateFeesPerGasRes;
  const gasLimit = estimateGasRes;

  const { encodedTransaction, fctMintAmount } = await prepareFacetTransaction(
    facetPublicClient.chain.id,
    fctMintRate,
    { ...params, maxFeePerGas, gasLimit }
  );

  const l1Transaction = {
    account: l1WalletClient.account,
    to: FACET_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chain: l1WalletClient.chain,
  };

  const l1TransactionHash = await l1WalletClient.sendTransaction(l1Transaction);

  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    l1WalletClient.account.address,
    l1WalletClient.account.address,
    params.to ?? "0x",
    params.value ?? 0n,
    params.data ?? "0x",
    gasLimit,
    maxFeePerGas,
    fctMintAmount
  );

  return {
    l1TransactionHash,
    facetTransactionHash,
    fctMintAmount,
    fctMintRate,
  };
};
