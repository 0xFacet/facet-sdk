export interface FacetTransactionParams {
  data?: `0x${string}` | undefined;
  to?: `0x${string}` | null | undefined;
  value?: bigint | undefined;
  mineBoost?: `0x${string}` | undefined;
}
