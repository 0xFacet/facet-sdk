import {
  Abi,
  Account,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  Hex,
  SendTransactionParameters,
  SendTransactionRequest,
  SendTransactionReturnType,
  WalletClient,
  WriteContractParameters,
  WriteContractReturnType,
} from "viem";

import { FacetTransactionParams } from "../types";
import { sendRawFacetTransaction } from "../utils";
import { sendFacetTransaction } from "./sendFacetTransaction";
import { writeFacetContract } from "./writeFacetContract";

/**
 * Creates a set of L1 facet actions bound to the provided wallet client
 * @param l1WalletClient - The viem wallet client for L1 interactions
 * @returns Object containing facet transaction functions
 */
export const walletL1FacetActions = (l1WalletClient: WalletClient) => ({
  /**
   * Sends a transaction through the Facet protocol using the bound L1 wallet client
   *
   * @param parameters - The transaction parameters
   * @returns A promise that resolves to the transaction hash
   */
  sendFacetTransaction: (
    parameters: SendTransactionParameters<
      Chain | undefined,
      Account | undefined,
      Chain | undefined,
      SendTransactionRequest
    > & { mineBoost?: Hex }
  ): Promise<SendTransactionReturnType> => {
    return sendFacetTransaction(l1WalletClient, parameters);
  },

  /**
   * Sends a raw transaction through the Facet protocol using the bound L1 wallet client
   *
   * @param parameters - The Facet transaction parameters
   * @returns A promise that resolves to the transaction result containing L1 and Facet transaction hashes
   */
  sendRawFacetTransaction: (
    parameters: FacetTransactionParams
  ): Promise<{
    l1TransactionHash: Hex;
    facetTransactionHash: Hex;
    fctMintAmount: bigint;
    fctMintRate: bigint;
  }> => {
    if (!l1WalletClient.account) {
      throw new Error("No account");
    }
    if (!l1WalletClient.chain) {
      throw new Error("No chain");
    }

    return sendRawFacetTransaction(
      l1WalletClient.chain.id,
      l1WalletClient.account.address,
      parameters,
      (l1Transaction) =>
        l1WalletClient.sendTransaction({
          ...l1Transaction,
          chain: l1WalletClient.chain as Chain | null | undefined,
          account: (l1WalletClient.account ?? l1Transaction.account) as Account,
        }),
      l1WalletClient.transport?.url
    );
  },

  /**
   * Writes to a contract through the Facet protocol using the bound L1 wallet client
   *
   * @param parameters - The contract write parameters
   * @returns A promise that resolves to the transaction hash
   */
  writeFacetContract: <
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
    args extends ContractFunctionArgs<
      abi,
      "nonpayable" | "payable",
      functionName
    >,
    chainOverride extends Chain | undefined = undefined,
  >(
    parameters: WriteContractParameters<
      abi,
      functionName,
      args,
      Chain | undefined,
      Account | undefined,
      chainOverride
    > & { mineBoost?: Hex }
  ): Promise<WriteContractReturnType> => {
    return writeFacetContract(l1WalletClient, parameters as any);
  },
});
