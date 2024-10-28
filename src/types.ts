export interface FacetTransactionParams {
  to: `0x${string}`; // L2 recipient address
  data?: `0x${string}`; // Optional encoded L2 transaction data
  value?: bigint; // Optional value being sent on L2 (defaults to zero if unspecified)
}
