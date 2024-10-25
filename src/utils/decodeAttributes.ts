import { hexToBytes, toHex } from "viem/utils";

export function decodeAttributes(calldata: `0x${string}`) {
  const data = hexToBytes(calldata);

  // Remove the function selector (first 4 bytes)
  let offset = 4;

  const baseFeeScalar = BigInt(toHex(data.slice(offset, offset + 4)));
  offset += 4;

  const blobBaseFeeScalar = BigInt(toHex(data.slice(offset, offset + 4)));
  offset += 4;

  const sequenceNumber = BigInt(toHex(data.slice(offset, offset + 8)));
  offset += 8;

  const timestamp = BigInt(toHex(data.slice(offset, offset + 8)));
  offset += 8;

  const number = BigInt(toHex(data.slice(offset, offset + 8)));
  offset += 8;

  const baseFee = BigInt(toHex(data.slice(offset, offset + 32)));
  offset += 32;

  const blobBaseFee = BigInt(toHex(data.slice(offset, offset + 32)));
  offset += 32;

  const hash = toHex(data.slice(offset, offset + 32));
  offset += 32;

  const batcherHash = toHex(data.slice(offset, offset + 32));
  offset += 32;

  const fctMintRate = BigInt(toHex(data.slice(offset, offset + 32)));
  offset += 32;

  const fctMintedInRateAdjustmentPeriod = BigInt(
    toHex(data.slice(offset, offset + 32))
  );

  return {
    timestamp,
    number,
    baseFee,
    blobBaseFee,
    hash,
    batcherHash,
    sequenceNumber,
    blobBaseFeeScalar,
    baseFeeScalar,
    fctMintRate,
    fctMintedInRateAdjustmentPeriod,
  };
}
