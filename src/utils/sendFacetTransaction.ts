import { WalletClient } from "viem";

import { FacetTransactionParams } from "@/types";
import { createFacetPublicClient } from "@/viem/createFacetPublicClient";

import { computeFacetTransactionHash } from "./computeFacetTransactionHash";
import { prepareFacetTransaction } from "./prepareFacetTransaction";

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

  const facetPublicClient = createFacetPublicClient(l1WalletClient.chain?.id);

  const { encodedTransaction, values } = await prepareFacetTransaction(
    facetPublicClient,
    params
  );

  const l1Transaction = {
    account: params.account,
    to: FACET_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chain: l1WalletClient.chain,
  };

  const l1TransactionHash = await l1WalletClient.sendTransaction(l1Transaction);

  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    params,
    values.gasLimit,
    values.maxFeePerGas,
    values.mintAmount
  );

  return { l1TransactionHash, facetTransactionHash };
};
