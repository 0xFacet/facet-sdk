import { CONTRACT_ADDRESSES } from "../constants/addresses";
import { FacetTransactionStatus } from "./transactions";

export interface FacetConfig {
  /** Called when transaction status changes */
  onTransaction?: (params: FacetTransactionStatus) => void;
  /** Override default contract addresses */
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}

export interface FacetResult {
  /** Send a read-only call to an L2 contract */
  sendFacetMethodRead: <T>(
    params: import("./contracts").ReadParams
  ) => Promise<T>;

  /** Send a transaction to an L2 contract */
  sendFacetMethodWrite: (
    params: import("./contracts").WriteParams
  ) => Promise<import("viem").TransactionReceipt>;

  /** Simulate a transaction without sending it */
  simulateFacetMethodWrite: <T>(
    params: import("./contracts").WriteParams
  ) => Promise<T>;

  /** Send a raw transaction to L2 */
  sendRawFacetTransaction: (
    params: import("./transactions").FacetTransactionParams
  ) => Promise<import("viem").TransactionReceipt>;
}
