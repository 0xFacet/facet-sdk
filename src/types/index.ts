import { Address, Hex } from "viem";

export interface FacetTransactionParams {
  data?: Hex | undefined;
  to?: Address | null | undefined;
  value?: bigint | undefined;
  mineBoost?: Hex | undefined;
}
