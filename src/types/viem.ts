import {
  Account,
  Chain,
  Client,
  PublicActions,
  RpcSchema,
  Transport,
} from "viem";
import { PublicActionsL2 } from "viem/op-stack";

export type FacetPublicClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  RpcSchema,
  PublicActions<Transport, Chain | undefined, Account | undefined> &
    PublicActionsL2<Chain | undefined, Account | undefined>
>;
