import {
  Address,
  concatHex,
  createPublicClient,
  Hex,
  http,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
} from "viem";
import { mainnet, sepolia } from "viem/chains";

import { FACET_INBOX_ADDRESS } from "../constants/addresses";
import { FacetTransactionParams } from "../types";
import { facetMainnet, facetSepolia } from "../viem";
import { calculateInputGasCost } from "./calculateInputGasCost";
import { computeFacetTransactionHash } from "./computeFacetTransactionHash";
import { getFctMintRate } from "./getFctMintRate";

interface L1Transaction {
  account: Address;
  to: "0x00000000000000000000000000000000000FacE7";
  value: bigint;
  data: Hex;
  gas: bigint;
  chainId: number;
}

/**
 * Builds a Facet transaction by preparing the transaction data and sending it to L1.
 *
 * @param l1ChainId - The chain ID of the L1 network (1 for mainnet, 11155111 for Sepolia)
 * @param account - The address of the account initiating the transaction
 * @param params - Transaction parameters including to, value, and data
 * @param sendL1Transaction - Function to send the L1 transaction and return the transaction hash
 * @returns Object containing the L1 transaction hash, Facet transaction hash, FCT mint amount, and FCT mint rate
 * @throws Error if L1 chain is invalid, account is missing, or L2 chain is not configured
 */
export const buildFacetTransaction = async (
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

  const facetPublicClient = createPublicClient({
    chain: l1ChainId === 1 ? facetMainnet : facetSepolia,
    transport: http(),
  });

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

  const transactionData = [
    toHex(facetPublicClient.chain.id),
    params.to ?? "0x",
    params.value ? toHex(params.value) : "0x",
    gasLimit ? toHex(gasLimit) : "0x",
    params.data ?? "0x",
    params.mineBoost ?? "0x",
  ];

  const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

  const inputCost = calculateInputGasCost(toBytes(encodedTransaction));
  const fctMintAmount = inputCost * fctMintRate;

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
