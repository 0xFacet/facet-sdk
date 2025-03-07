import { TransactionReceipt } from "viem";

import { CONTRACT_ADDRESSES } from "../constants/addresses";
import { WriteParams } from "./contracts";
import { FacetTransactionParams, FacetTransactionStatus } from "./transactions";

export interface FacetHookConfig {
  /** Called when transaction status changes */
  onTransaction?: (params: FacetTransactionStatus) => void;
  /** Override default contract addresses */
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}

export interface FacetHookReturn {
  /** Bridges ETH from L1 to L2 and executes a call on L2 */
  sendBridgeAndCallTransaction: (
    transaction: FacetTransactionParams,
    ethValue: bigint
  ) => Promise<TransactionReceipt>;
  /** Sends a transaction through the Buddy Factory contract */
  sendFacetBuddyTransaction: (
    transaction: FacetTransactionParams,
    ethValue: bigint
  ) => Promise<TransactionReceipt>;
  /** Sends a transaction to the Facet network */
  sendFacetTransaction: (
    transaction: FacetTransactionParams
  ) => Promise<TransactionReceipt>;
  /** Executes a write function on a contract on the Facet network */
  writeFacetContract: (params: WriteParams) => Promise<TransactionReceipt>;
}
