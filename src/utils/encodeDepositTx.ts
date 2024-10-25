import { concatHex, toHex, toRlp } from "viem";

interface DepositTx {
  sourceHash: `0x${string}`;
  l1TxOrigin: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}` | null;
  mint: bigint;
  value: bigint;
  gasFeeCap: bigint;
  gasLimit: bigint;
  data: `0x${string}`;
}

export const encodeDepositTx = (tx: DepositTx): `0x${string}` => {
  const serializedTransaction = [
    tx.sourceHash,
    tx.l1TxOrigin,
    tx.from,
    tx.to ?? "0x",
    tx.mint ? toHex(tx.mint) : "0x",
    tx.value ? toHex(tx.value) : "0x",
    tx.gasFeeCap ? toHex(tx.gasFeeCap) : "0x",
    tx.gasLimit ? toHex(tx.gasLimit) : "0x",
    "0x",
    tx.data ?? "0x",
  ] as `0x${string}`[];
  return concatHex(["0x7e", toRlp(serializedTransaction)]);
};
