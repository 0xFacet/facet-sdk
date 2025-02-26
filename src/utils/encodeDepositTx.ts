import { concatHex, Hex, toHex, toRlp } from "viem";

import { DepositTx } from "../types";

/**
 * Encodes a deposit transaction into a serialized hex format.
 *
 * @param tx - The deposit transaction to encode
 * @param tx.sourceHash - The hash of the source transaction
 * @param tx.from - The address sending the transaction
 * @param tx.to - The recipient address
 * @param tx.mint - Optional amount to mint (will be converted to hex)
 * @param tx.value - Optional value to transfer (will be converted to hex)
 * @param tx.gasLimit - Optional gas limit (will be converted to hex)
 * @param tx.data - The calldata for the transaction
 * @returns A hex string of the encoded transaction
 */
export const encodeDepositTx = (tx: DepositTx): Hex => {
  const serializedTransaction = [
    tx.sourceHash,
    tx.from,
    tx.to,
    tx.mint ? toHex(tx.mint) : "0x",
    tx.value ? toHex(tx.value) : "0x",
    tx.gasLimit ? toHex(tx.gasLimit) : "0x",
    "0x",
    tx.data,
  ] as Hex[];
  return concatHex(["0x7e", toRlp(serializedTransaction)]);
};
