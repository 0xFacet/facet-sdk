import { keccak256 } from "viem";

import { FacetTransactionParams } from "@/types";

import { computeSourceHash } from "./computeSourceHash";
import { encodeDepositTx } from "./encodeDepositTx";

export const computeFacetTransactionHash = (
  l1TransactionHash: `0x${string}`,
  params: FacetTransactionParams,
  gasLimit: bigint,
  maxFeePerGas: bigint,
  mintAmount: bigint
): `0x${string}` => {
  const { to, value = 0n, data = "0x", account } = params;

  const sourceHash = computeSourceHash(l1TransactionHash);

  const encodedTx = encodeDepositTx({
    sourceHash,
    l1TxOrigin: account.address,
    from: account.address,
    to,
    mint: mintAmount,
    value,
    gasFeeCap: maxFeePerGas,
    gasLimit,
    data,
  });

  return keccak256(encodedTx);
};
