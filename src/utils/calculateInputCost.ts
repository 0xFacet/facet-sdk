export const calculateInputCost = (input: Uint8Array) => {
  let totalGasCost = 0n;
  input.forEach((byte) => {
    totalGasCost += byte === 0 ? 4n : 16n;
  });
  return totalGasCost;
};
