/**
 * Calculates the gas cost of input data based on EVM gas rules.
 * Each zero byte costs 4 gas, while each non-zero byte costs 16 gas.
 *
 * @param input - The input data as a Uint8Array
 * @returns The total gas cost as a BigInt
 */
/**
 * Calculate the input gas cost for calldata according to EIP-7623.
 * 
 * EIP-7623 introduces a floor cost for calldata to prevent abuse for data availability.
 * The gas cost is the maximum of:
 * 1. Standard cost: 4 gas per zero byte + 16 gas per non-zero byte
 * 2. Floor cost: 10 gas per token (where tokens = zero_bytes + nonzero_bytes * 4)
 * 
 * This function only calculates the calldata portion - execution gas and base costs
 * are handled elsewhere in the transaction gas calculation.
 * 
 * @param input - The calldata bytes
 * @returns The gas cost for the calldata portion
 */
export const calculateInputGasCost = (input: Uint8Array) => {
  // EIP-7623 Constants
  const STANDARD_TOKEN_COST = 4n;  // Cost per token under standard pricing
  const TOTAL_COST_FLOOR_PER_TOKEN = 10n;  // Floor cost per token
  
  // Count zero and non-zero bytes
  let zeroBytes = 0n;
  let nonZeroBytes = 0n;
  
  input.forEach((byte) => {
    if (byte === 0) {
      zeroBytes += 1n;
    } else {
      nonZeroBytes += 1n;
    }
  });
  
  // Calculate tokens: zero_bytes + nonzero_bytes * 4
  const tokensInCalldata = zeroBytes + nonZeroBytes * 4n;
  
  // Standard cost: 4 gas per zero byte + 16 gas per non-zero byte
  // This is equivalent to STANDARD_TOKEN_COST * tokens_in_calldata
  const standardCost = STANDARD_TOKEN_COST * tokensInCalldata;
  
  // Floor cost: 10 gas per token
  const floorCost = TOTAL_COST_FLOOR_PER_TOKEN * tokensInCalldata;
  
  // EIP-7623: Return the maximum of standard cost and floor cost
  return standardCost > floorCost ? standardCost : floorCost;
};
