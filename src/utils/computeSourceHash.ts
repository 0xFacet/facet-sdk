import { concatBytes, keccak256, padBytes, toBytes } from "viem";

export const computeSourceHash = (
  l1TransactionHash: `0x${string}`
): `0x${string}` => {
  const paddedSourceDomain = padBytes(toBytes(0), { size: 32, dir: "left" });

  const payloadHash = keccak256(l1TransactionHash);

  const combinedBytes = concatBytes([paddedSourceDomain, toBytes(payloadHash)]);
  return keccak256(combinedBytes);
};
