import {
  Account,
  BaseError,
  Chain,
  Client,
  SendTransactionParameters,
  SendTransactionRequest,
  SendTransactionReturnType,
  Transport,
} from "viem";
import { sendTransaction } from "viem/actions";
import { getTransactionError } from "viem/utils";

import { buildFacetTransaction } from "../utils";

/**
 * Sends a transaction through the Facet protocol.
 *
 * This function builds a Facet transaction using the provided parameters and sends it using
 * the viem client. It handles the complexities of creating L2 transactions on the Facet network.
 *
 * @template chain - The chain type parameter
 * @template account - The account type parameter
 * @template request - The request type parameter
 * @template chainOverride - Optional chain override type parameter
 *
 * @param client - The viem client instance used to interact with the blockchain
 * @param parameters - The transaction parameters, following viem's SendTransactionParameters format
 *
 * @returns A promise that resolves to the transaction hash
 *
 * @throws Will throw and properly format any errors that occur during transaction sending
 *
 * @example
 * const hash = await sendFacetTransaction(client, {
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...'
 * });
 */
export async function sendFacetTransaction<
  chain extends Chain | undefined,
  account extends Account | undefined,
  const request extends SendTransactionRequest<chain, chainOverride>,
  chainOverride extends Chain | undefined = undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: SendTransactionParameters<chain, account, chainOverride, request>
): Promise<SendTransactionReturnType> {
  try {
    const { facetTransactionHash } = await buildFacetTransaction(
      client.chain!.id,
      client.account!.address,
      {
        data: parameters.data,
        to: parameters.to,
        value: parameters.value,
      },
      (l1Transaction) =>
        sendTransaction(client, {
          chain: client.chain as Chain | null | undefined,
          ...l1Transaction,
        })
    );
    return facetTransactionHash;
  } catch (err) {
    throw getTransactionError(err as BaseError, {
      ...parameters,
      account: client.account || null,
      chain: parameters.chain || undefined,
    });
  }
}
