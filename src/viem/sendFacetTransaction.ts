import {
  Account,
  BaseError,
  Chain,
  Hex,
  SendTransactionParameters,
  SendTransactionRequest,
  SendTransactionReturnType,
  Transport,
  WalletClient,
} from "viem";
import { sendTransaction } from "viem/actions";
import { getTransactionError, parseAccount } from "viem/utils";

import { sendRawFacetTransaction } from "../utils";

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
 * @param parameters.data - The transaction calldata
 * @param parameters.to - The recipient address
 * @param parameters.value - The amount of ether to send
 * @param parameters.mineBoost - Optional hex to increase FCT mining amount
 *
 * @returns A promise that resolves to the transaction hash
 *
 * @throws Will throw and properly format any errors that occur during transaction sending
 *
 * @example
 * const hash = await sendFacetTransaction(client, {
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...',
 *   mineBoost: '0x1' // Optional: increase FCT mining amount
 * });
 */
export async function sendFacetTransaction<
  chain extends Chain | undefined,
  account extends Account | undefined,
  const request extends SendTransactionRequest<chain, chainOverride>,
  chainOverride extends Chain | undefined = undefined,
>(
  client: WalletClient<Transport, chain, account>,
  parameters: SendTransactionParameters<
    chain,
    account,
    chainOverride,
    request
  > & { mineBoost?: Hex }
): Promise<SendTransactionReturnType> {
  try {
    const chain = (parameters.chain ?? client.chain) as Chain | chain | null;
    const accountOrAddress = parameters.account ?? client.account;
    const account = accountOrAddress ? parseAccount(accountOrAddress) : null;

    const { facetTransactionHash } = await sendRawFacetTransaction(
      chain!.id,
      account!.address,
      {
        data: parameters.data,
        to: parameters.to,
        value: parameters.value,
        mineBoost: parameters.mineBoost,
      },
      ({ chainId, ...l1Transaction }) =>
        sendTransaction(client, {
          ...l1Transaction,
          chain,
          account,
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
