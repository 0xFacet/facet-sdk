import { Account, maxUint256, WalletClient } from "viem";

import { FacetTransactionParams } from "../types";
import { computeFacetTransactionHash } from "../utils/computeFacetTransactionHash";
import { prepareFacetTransaction } from "../utils/prepareFacetTransaction";
import { createFacetPublicClient } from "./createFacetPublicClient";
import { getFctMintRate } from "./getFctMintRate";

export const FACET_INBOX_ADDRESS =
  "0x00000000000000000000000000000000000FacE7" as const;

export const sendFacetTransaction = async (
  l1WalletClient: WalletClient,
  params: FacetTransactionParams
) => {
  const selectedChain = params.chain || l1WalletClient.chain;
  const account =
    (params.account as Account)?.address || params.account || l1WalletClient.account;

  if (
    // selectedChain?.id !== 1 &&
    selectedChain?.id !== 11_155_111
  ) {
    throw new Error("Invalid L1 chain, currently only Sepolia (11155111)");
  }

  if (!account) {
    throw new Error(
      "No valid account provided when calling sendFacetTransaction",
    );
  }

  const facetPublicClient = createFacetPublicClient(
    selectedChain,
  );

  if (!facetPublicClient.chain) {
    throw new Error("L2 chain not configured");
  }

  const [estimateFeesPerGasRes, estimateGasRes, fctBalance, fctMintRate] =
    await Promise.all([
      facetPublicClient.estimateFeesPerGas({
        type: "eip1559",
        chain: facetPublicClient.chain,
      }),
      facetPublicClient.estimateGas({
        account,
        to: params.to,
        value: params.value,
        data: params.data,
        stateOverride: [
          {
            address: (account as any)?.address || account,
            balance: maxUint256,
          },
        ],
      }),
      facetPublicClient.getBalance({
        address: (account as any)?.address || account,
      }),
      getFctMintRate(facetPublicClient.chain),
    ]);

  if (!estimateFeesPerGasRes?.maxFeePerGas) {
    throw new Error("Max fee per gas estimate not found");
  }

  const { maxFeePerGas } = estimateFeesPerGasRes;
  const gasLimit = estimateGasRes;
  const { encodedTransaction, fctMintAmount } = await prepareFacetTransaction(
    facetPublicClient.chain.id,
    fctMintRate,
    { ...params, maxFeePerGas, gasLimit },
  );

  // Call estimateGas again but with an accurate future balance
  // This will allow it to correctly revert when necessary
  await facetPublicClient.estimateGas({
    account,
    to: params.to,
    value: params.value,
    data: params.data,
    stateOverride: [
      {
        address: (account as any)?.address || account,
        balance: fctBalance + fctMintAmount,
      },
    ],
  });

  const l1Transaction = {
    account,
    to: FACET_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chain: l1WalletClient.chain,
  };

  const l1TransactionHash = await l1WalletClient.sendTransaction(l1Transaction);

  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    (account as any)?.address || account,
    (account as any)?.address || account,
    params.to ?? "0x",
    params.value ?? 0n,
    params.data ?? "0x",
    gasLimit,
    maxFeePerGas,
    fctMintAmount,
  );

  return {
    l1TransactionHash,
    facetTransactionHash,
    fctMintAmount,
    fctMintRate,
  };
};
