import { Address, Hex } from "viem";

import { CONTRACT_ADDRESSES } from "../constants";

export interface FacetTransactionParams {
  data?: Hex | undefined;
  to?: Address | null | undefined;
  value?: bigint | undefined;
  mineBoost?: Hex | undefined;
}

export interface BridgeAndCallConfig {
  /** Override default contract addresses */
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}
