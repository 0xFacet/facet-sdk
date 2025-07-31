import { Address, concatHex, Hex, keccak256, toHex, toRlp } from "viem";

/**
 * Computes a hash for a Facet transaction.
 *
 * @param l1TransactionHash - The hash of the L1 transaction
 * @param from - The address sending the transaction
 * @param to - The recipient address of the transaction
 * @param value - The amount of FCT to send with the transaction
 * @param data - The calldata for the transaction
 * @param gasLimit - The maximum amount of gas the transaction can use
 * @param mint - The amount of FCT mint in the transaction. If not provided, the transaction is considered Bluebird transaction.
 * @returns A keccak256 hash of the encoded transaction
 */
export const computeFacetTransactionHash = (
  sourceHash: Hex,
  from: Address,
  to: Address | null,
  value: bigint,
  data: Hex,
  gasLimit: bigint,
  _mint?: bigint
): Hex => {
  const serializedTransaction = [
    sourceHash,
    from,
    to ? to : "0x",
    "0x",
    value ? toHex(value) : "0x",
    gasLimit ? toHex(gasLimit) : "0x",
    "0x",
    data,
  ] as Hex[];
  
  const encodedTx = concatHex(["0x7d", toRlp(serializedTransaction)]);

  return keccak256(encodedTx);
};
