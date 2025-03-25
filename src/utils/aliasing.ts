import { Address } from "viem";

const OFFSET = BigInt("0x1111000000000000000000000000000000001111");

class InvalidAddress extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAddress";
  }
}

/**
 * Converts the address in L1 that submitted a transaction to the inbox
 * to the corresponding L2 address viewed in msg.sender.
 *
 * @param l1Address The address in L1 that triggered the transaction to L2.
 * @returns The corresponding L2 address as viewed in msg.sender.
 */
export function applyL1ToL2Alias(l1Address: Address): Address {
  const normalizedAddress = l1Address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(normalizedAddress)) {
    throw new InvalidAddress(`Invalid address: ${l1Address}`);
  }

  // Convert the L1 address to a 160-bit integer
  const l1BigInt = BigInt(normalizedAddress);

  // Add the offset (unchecked, no overflow handling needed)
  const l2BigInt = (l1BigInt + OFFSET) % BigInt(2) ** BigInt(160);

  // Convert the result back to a hex string representing a 20-byte Ethereum address
  const l2Address = `0x${l2BigInt.toString(16).padStart(40, "0")}`;
  return l2Address as Address;
}

/**
 * Converts the L2 address viewed in msg.sender to the original L1 address
 * that submitted the transaction to the inbox.
 *
 * @param l2Address The L2 address as viewed in msg.sender.
 * @returns The original L1 address that triggered the transaction to L2.
 */
export function undoL1ToL2Alias(l2Address: Address): Address {
  const normalizedAddress = l2Address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(normalizedAddress)) {
    throw new InvalidAddress(`Invalid address: ${l2Address}`);
  }

  // Convert the L2 address to a 160-bit integer
  const l2BigInt = BigInt(normalizedAddress);

  // Subtract the offset (unchecked, using modular arithmetic for 160-bit unsigned integers)
  const l1BigInt =
    (l2BigInt - OFFSET + BigInt(2) ** BigInt(160)) % BigInt(2) ** BigInt(160);

  // Convert the result back to a hex string representing a 20-byte Ethereum address
  const l1Address = `0x${l1BigInt.toString(16).padStart(40, "0")}`;
  return l1Address as Address;
}
