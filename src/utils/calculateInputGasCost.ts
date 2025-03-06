/**
 * Calculates the gas cost of input data based on EVM gas rules.
 * Each zero byte costs 4 gas, while each non-zero byte costs 16 gas.
 *
 * @param input - The input data as a Uint8Array
 * @returns The total gas cost as a BigInt
 */
export const calculateInputGasCost = (input: Uint8Array) => {
  let totalGasCost = 0n;
  input.forEach((byte) => {
    totalGasCost += byte === 0 ? 4n : 16n;
  });
  return totalGasCost;
};
