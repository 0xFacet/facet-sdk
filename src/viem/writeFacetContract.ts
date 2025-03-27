import {
  Abi,
  Account,
  BaseError,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  getContractError,
  Hex,
  Transport,
  WriteContractParameters,
  WriteContractReturnType,
} from "viem";
import { parseAccount } from "viem/accounts";
import { sendTransaction } from "viem/actions";

import { sendRawFacetTransaction } from "../utils";

/**
 * Executes a write operation on a smart contract through the Facet infrastructure.
 *
 * This function encodes the function call data, builds a Facet transaction, and sends it
 * to the blockchain. It handles the complexity of interacting with the Facet protocol
 * while maintaining a similar interface to viem's standard contract writing functions.
 *
 * @template {Chain | undefined} chain - The blockchain chain type
 * @template {Account | undefined} account - The account type
 * @template {Abi | readonly unknown[]} abi - The contract ABI
 * @template {ContractFunctionName<abi, "nonpayable" | "payable">} functionName - The contract function name
 * @template {ContractFunctionArgs<abi, "nonpayable" | "payable", functionName>} args - The function arguments
 * @template {Chain | undefined} chainOverride - Optional chain override
 *
 * @param {Client<Transport, chain, account>} client - The viem client instance
 * @param {WriteContractParameters<abi, functionName, args, chain, account, chainOverride>} parameters - The contract write parameters
 * @param {abi} parameters.abi - The contract ABI
 * @param {account} [parameters.account] - The account to use (defaults to client.account)
 * @param {Address} parameters.address - The contract address
 * @param {args} parameters.args - The function arguments
 * @param {string} [parameters.dataSuffix] - Optional data to append to the transaction data
 * @param {functionName} parameters.functionName - The name of the function to call
 * @param {Hex} [parameters.mineBoost] - Optional hex value to increase FCT mining amount
 *
 * @returns {Promise<WriteContractReturnType>} The transaction hash
 *
 * @throws {Error} If no account is provided or found in the client
 * @throws {BaseError} With contract context if the transaction fails
 *
 * @example
 * const hash = await writeFacetContract(client, {
 *   address: '0x...',
 *   abi: MyContractABI,
 *   functionName: 'setName',
 *   args: ['New Name'],
 *   mineBoost: '0x1234' // Optional: increase FCT mining amount
 * })
 */
export async function writeFacetContract<
  chain extends Chain | undefined,
  account extends Account | undefined,
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  chainOverride extends Chain | undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: WriteContractParameters<
    abi,
    functionName,
    args,
    chain,
    account,
    chainOverride
  > & { mineBoost?: Hex }
): Promise<WriteContractReturnType> {
  const {
    abi,
    account: account_ = client.account,
    address,
    args,
    chain = client.chain,
    dataSuffix,
    functionName,
    ...request
  } = parameters as WriteContractParameters & { mineBoost?: Hex };

  if (typeof account_ === "undefined") throw new Error("No account");
  const account = account_ ? parseAccount(account_) : null;

  const data = encodeFunctionData({
    abi,
    args,
    functionName,
  } as EncodeFunctionDataParameters);

  try {
    const { facetTransactionHash } = await sendRawFacetTransaction(
      chain!.id,
      account!.address,
      {
        data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
        to: address,
        value: request.value,
        mineBoost: request.mineBoost,
      },
      ({ chainId, ...l1Transaction }) =>
        sendTransaction(client, {
          ...l1Transaction,
          chain,
          account,
        })
    );
    return facetTransactionHash;
  } catch (error) {
    throw getContractError(error as BaseError, {
      abi,
      address,
      args,
      docsPath: "/docs/contract/writeContract",
      functionName,
      sender: account?.address,
    });
  }
}
