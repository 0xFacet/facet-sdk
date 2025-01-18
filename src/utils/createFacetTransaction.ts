import { Address, createPublicClient, Hex, http, maxUint256 } from "viem";
import { mainnet, sepolia } from "viem/chains";

import { FacetTransactionParams } from "../types";
import { createFacetPublicClient } from "../viem/createFacetPublicClient";
import { getFctMintRate } from "../viem/getFctMintRate";
import { computeFacetTransactionHash } from "./computeFacetTransactionHash";
import { prepareFacetTransaction } from "./prepareFacetTransaction";

const FACET_INBOX_ADDRESS =
  "0x00000000000000000000000000000000000FacE7" as const;

interface L1Transaction {
  account: `0x${string}`;
  to: "0x00000000000000000000000000000000000FacE7";
  value: bigint;
  data: `0x${string}`;
  gas: bigint;
  chainId: number;
}

export const createFacetTransaction = async (
  l1ChainId: number,
  account: Address,
  params: FacetTransactionParams,
  sendL1Transaction: (l1Transaction: L1Transaction) => Promise<Hex>
) => {
  if (l1ChainId !== 1 && l1ChainId !== 11_155_111) {
    throw new Error("Invalid L1 chain");
  }

  if (!account) {
    throw new Error("No account");
  }

  const facetPublicClient = createFacetPublicClient(l1ChainId);

  if (!facetPublicClient.chain) {
    throw new Error("L2 chain not configured");
  }

  const [estimateGasRes, fctBalance, fctMintRate] = await Promise.all([
    facetPublicClient.estimateGas({
      account,
      to: params.to,
      value: params.value,
      data: params.data,
      stateOverride: [{ address: account, balance: maxUint256 }],
    }),
    facetPublicClient.getBalance({
      address: account,
    }),
    getFctMintRate(l1ChainId),
  ]);

  const gasLimit = estimateGasRes;

  const { encodedTransaction, fctMintAmount } = await prepareFacetTransaction(
    facetPublicClient.chain.id,
    fctMintRate,
    { ...params, gasLimit }
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
        address: account,
        balance: fctBalance + fctMintAmount,
      },
    ],
  });

  const l1Transaction = {
    account,
    to: FACET_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chainId: l1ChainId,
  };

  const l1PublicClient = createPublicClient({
    chain: l1ChainId === 1 ? mainnet : sepolia,
    transport: http(),
  });
  const estimateL1Gas = await l1PublicClient.estimateGas(l1Transaction);

  const l1TransactionHash = await sendL1Transaction({
    ...l1Transaction,
    gas: estimateL1Gas,
  });

  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    account,
    params.to ?? "0x",
    params.value ?? 0n,
    params.data ?? "0x",
    gasLimit,
    fctMintAmount
  );

  return {
    l1TransactionHash,
    facetTransactionHash,
    fctMintAmount,
    fctMintRate,
  };
};
