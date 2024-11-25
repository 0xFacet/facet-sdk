import { concatHex, toHex, toRlp } from "viem";

interface DepositTx {
  sourceHash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  mint: bigint;
  value: bigint;
  gasLimit: bigint;
  data: `0x${string}`;
}

export const encodeDepositTx = (tx: DepositTx): `0x${string}` => {
  const serializedTransaction = [
    tx.sourceHash,
    tx.from,
    tx.to,
    tx.mint ? toHex(tx.mint) : "0x",
    tx.value ? toHex(tx.value) : "0x",
    tx.gasLimit ? toHex(tx.gasLimit) : "0x",
    "0x",
    tx.data,
  ] as `0x${string}`[];
  return concatHex(["0x7e", toRlp(serializedTransaction)]);
};
