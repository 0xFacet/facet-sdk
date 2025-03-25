import {
  Abi,
  Account,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  SendTransactionParameters,
  SendTransactionRequest,
  SendTransactionReturnType,
  WalletClient,
  WriteContractParameters,
  WriteContractReturnType,
} from "viem";

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
    >
  ): Promise<SendTransactionReturnType> => {
    return sendFacetTransaction(l1WalletClient, parameters);
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
    >
  ): Promise<WriteContractReturnType> => {
    return writeFacetContract(l1WalletClient, parameters);
  },
});
