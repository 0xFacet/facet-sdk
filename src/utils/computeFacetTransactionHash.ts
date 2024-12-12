import { keccak256 } from "viem";

import { encodeDepositTx } from "./encodeDepositTx";

export const computeFacetTransactionHash = (
  l1TransactionHash: `0x${string}`,
  from: `0x${string}`,
  to: `0x${string}`,
  value: bigint,
  data: `0x${string}`,
  gasLimit: bigint,
  mint: bigint
): `0x${string}` => {
  const encodedTx = encodeDepositTx({
    sourceHash: l1TransactionHash,
    from,
    to,
    mint,
    value,
    gasLimit,
    data,
  });

  return keccak256(encodedTx);
};
