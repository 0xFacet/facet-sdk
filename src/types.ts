export interface FacetTransactionParams {
  to: `0x${string}` | null; // L2 recipient address
  data?: `0x${string}`; // Optional encoded L2 transaction data
  value?: bigint; // Optional value being sent on L2 (defaults to zero if unspecified)
  extraData?: `0x${string}`; // Optional extra data to increase L1 cost for mining FCT
}
