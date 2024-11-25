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

import { facetSepolia } from "./chains";

export type FacetPublicClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  RpcSchema,
  PublicActions<Transport, Chain | undefined, Account | undefined> &
  PublicActionsL2<Chain | undefined, Account | undefined>
>;


export function createFacetPublicClient(chain: Chain) {
  if (chain?.id === 1) {
    throw new Error("Facet is not on mainnet");
  }

  const net = chain.id === 1 ? "mainnet" : "sepolia";

  return createPublicClient({
    chain,
    transport: http(`https://${net}.facet.org`),
  }).extend(publicActionsL2());
}
