import { keccak256 } from "viem";

import { computeSourceHash } from "./computeSourceHash";
import { encodeDepositTx } from "./encodeDepositTx";

export const computeFacetTransactionHash = (
  l1TransactionHash: `0x${string}`,
  l1TxOrigin: `0x${string}`,
  from: `0x${string}`,
  to: `0x${string}`,
  value: bigint,
  data: `0x${string}`,
  gasLimit: bigint,
  gasFeeCap: bigint,
  mint: bigint
): `0x${string}` => {
  const sourceHash = computeSourceHash(l1TransactionHash);

  const encodedTx = encodeDepositTx({
    sourceHash,
    l1TxOrigin,
    from,
    to,
    mint,
    value,
    gasFeeCap,
    gasLimit,
    data,
  });

  return keccak256(encodedTx);
};
