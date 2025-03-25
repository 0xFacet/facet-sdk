import { Address, fromHex, fromRlp, Hex } from "viem";

/**
 * Decodes the encoded transaction data from an L1 transaction to the Facet Inbox
 *
 * @param encodedData - The encoded transaction data
 * @returns The decoded transaction parameters
 * @throws Error if the data cannot be decoded
 */
export const decodeFacetEncodedTransaction = async (encodedData: Hex) => {
  if (!encodedData || encodedData.length < 4) {
    throw new Error("Invalid Facet transaction calldata");
  }

  const strippedData = `0x${encodedData.slice(4)}` as Hex; // Remove '0x' and '46' prefix
  const decoded = fromRlp(strippedData);

  if (!Array.isArray(decoded) || decoded.length < 6) {
    throw new Error("Invalid RLP structure");
  }

  const l2ChainId = fromHex(decoded[0] as Hex, "number");
  const to = decoded[1] as Address;

  // Handle empty hex values by defaulting to 0n
  const value = decoded[2] === "0x" ? 0n : fromHex(decoded[2] as Hex, "bigint");
  const gasLimit =
    decoded[3] === "0x" ? 0n : fromHex(decoded[3] as Hex, "bigint");
  const data = decoded[4] as Hex;
  const fctMintAmount =
    decoded[5] === "0x" ? 0n : fromHex(decoded[5] as Hex, "bigint");

  return {
    l2ChainId,
    to,
    value,
    data,
    gasLimit,
    fctMintAmount,
  };
};
