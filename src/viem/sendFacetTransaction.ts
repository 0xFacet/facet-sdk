import { createPublicClient, http, maxUint256, WalletClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

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
    l1WalletClient.chain?.id !== 1 &&
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

  const [estimateGasRes, fctBalance, fctMintRate] = await Promise.all([
    facetPublicClient.estimateGas({
      account: l1WalletClient.account,
      to: params.to,
      value: params.value,
      data: params.data,
      stateOverride: [
        { address: l1WalletClient.account.address, balance: maxUint256 },
      ],
    }),
    facetPublicClient.getBalance({
      address: l1WalletClient.account.address,
    }),
    getFctMintRate(l1WalletClient.chain.id),
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
    account: l1WalletClient.account,
    to: params.to,
    value: params.value,
    data: params.data,
    stateOverride: [
      {
        address: l1WalletClient.account.address,
        balance: fctBalance + fctMintAmount,
      },
    ],
  });

  const l1Transaction = {
    account: l1WalletClient.account,
    to: FACET_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chain: l1WalletClient.chain,
  };

  const l1PublicClient = createPublicClient({
    chain: l1WalletClient.chain.id === 1 ? mainnet : sepolia,
    transport: http(),
  });
  const estimateL1Gas = await l1PublicClient.estimateGas(l1Transaction);

  const l1TransactionHash = await l1WalletClient.sendTransaction({
    ...l1Transaction,
    gas: estimateL1Gas,
  });

  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    l1WalletClient.account.address,
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
