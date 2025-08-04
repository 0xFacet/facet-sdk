import { createPublicClient, getAddress, Hex, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

import { FACET_INBOX_ADDRESS } from "../constants/addresses";
import { computeFacetTransactionHash } from "./computeFacetTransactionHash";
import { decodeFacetEncodedTransaction } from "./decodeFacetEncodedTransaction";

/**
 * Gets the Facet transaction hash from an L1 transaction hash
 *
 * @param l1TransactionHash - The hash of the L1 transaction
 * @param l1ChainId - The chain ID of the L1 network (1 for mainnet, 11155111 for Sepolia)
 * @returns The Facet transaction hash
 * @throws Error if L1 chain is invalid or if the transaction is not a valid Facet transaction
 */
export const getFacetTransactionHashFromL1Hash = async (
  l1TransactionHash: Hex,
  l1ChainId: number
): Promise<Hex> => {
  if (l1ChainId !== 1 && l1ChainId !== 11_155_111) {
    throw new Error("Invalid L1 chain");
  }

  // Create a public client for the L1 chain
  const l1PublicClient = createPublicClient({
    chain: l1ChainId === 1 ? mainnet : sepolia,
    transport: http(),
  });

  // Get the L1 transaction
  const l1Transaction = await l1PublicClient.getTransaction({
    hash: l1TransactionHash,
  });

  // Verify this is a transaction to the Facet Inbox
  if (
    l1Transaction.to &&
    getAddress(l1Transaction.to) !== getAddress(FACET_INBOX_ADDRESS)
  ) {
    throw new Error("Transaction is not to Facet Inbox address");
  }

  // Decode the transaction data to extract Facet transaction parameters
  const { to, value, data, gasLimit, fctMintAmount } =
    await decodeFacetEncodedTransaction(l1Transaction.input);

  // Compute and return the Facet transaction hash
  return computeFacetTransactionHash(
    l1TransactionHash,
    l1Transaction.from,
    to,
    value,
    data,
    gasLimit,
    fctMintAmount
  );
};
