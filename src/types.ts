import {
  Account,
  Chain,
  Client,
  PublicActions,
  RpcSchema,
  Transport,
} from "viem";
import { PublicActionsL2 } from "viem/op-stack";

export interface FacetTransactionParams {
  /** Contract code or a hashed method call with encoded args */
  data?: `0x${string}` | undefined;
  /** Transaction recipient */
  to?: `0x${string}` | null | undefined;
  /** Value in wei sent with this transaction */
  value?: bigint | undefined;
  /** Extra data to increase cost of L1 txn to mine more FCT */
  extraData?: `0x${string}` | undefined;
}

// Facet Public Client type with the combined extensions
export type FacetPublicClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  RpcSchema,
  PublicActions<Transport, Chain | undefined, Account | undefined> &
    PublicActionsL2<Chain | undefined, Account | undefined>
>;
