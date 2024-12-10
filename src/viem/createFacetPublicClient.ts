import {
  Account,
  Chain,
  Client,
  createPublicClient,
  http,
  PublicActions,
  RpcSchema,
  Transport,
} from "viem";
import { PublicActionsL2, publicActionsL2 } from "viem/op-stack";

import { facetMainnet, facetSepolia } from "./chains";

export type FacetPublicClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  RpcSchema,
  PublicActions<Transport, Chain | undefined, Account | undefined> &
    PublicActionsL2<Chain | undefined, Account | undefined>
>;

export const createFacetPublicClient = (
  l1ChainId: 1 | 11_155_111
): FacetPublicClient => {
  return createPublicClient({
    chain: l1ChainId === 1 ? facetMainnet : facetSepolia,
    transport: http(),
  }).extend(publicActionsL2());
};
