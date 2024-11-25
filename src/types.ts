import { Account, Address, Chain } from "viem";

export interface FacetTransactionParams {
  data?: `0x${string}` | undefined;
  to?: `0x${string}` | null | undefined;
  value?: bigint | undefined;
  extraData?: `0x${string}` | undefined;
  chain?: Chain | undefined
  account?: Account | Address | Account & { address: `0x${string}` } | `0x${string}` | undefined;
}
