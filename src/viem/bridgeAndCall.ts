import { LibZip } from "solady";
import {
  Abi,
  Account,
  BaseError,
  Chain,
  Client,
  concatHex,
  ContractFunctionArgs,
  ContractFunctionName,
  createPublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  getContractError,
  Hex,
  http,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
  Transport,
  WriteContractParameters,
  WriteContractReturnType,
} from "viem";
import { parseAccount } from "viem/accounts";
import { sendTransaction } from "viem/actions";
import { mainnet, sepolia } from "viem/chains";

import { CONTRACT_ADDRESSES, etherBridgeAbi } from "../constants";
import { BridgeAndCallConfig } from "../types";
import {
  applyL1ToL2Alias,
  computeFacetTransactionHash,
  getFctMintRate,
} from "../utils";
import { facetMainnet, facetSepolia } from "./chains";

/**
 * Bridges ETH from L1 to L2 and executes a contract call on Facet (L2).
 *
 * This function handles the complexities of bridging ETH from L1 to L2 and executing a contract call
 * on the Facet network. It includes transaction simulation, gas estimation, and proper encoding of
 * the bridged transaction data.
 *
 * @template chain - The chain type for the client
 * @template account - The account type for the client
 * @template abi - The ABI type for the contract
 * @template functionName - The name of the function to call
 * @template args - The arguments for the function call
 * @template chainOverride - Optional chain override type
 *
 * @param client - The viem client instance used to interact with the blockchain
 * @param parameters - The contract parameters, following viem's WriteContractParameters format
 * @param ethValue - The amount of ETH to bridge (in wei)
 * @param config - Optional configuration object for contract addresses
 *
 * @returns A promise that resolves to the Facet transaction hash
 *
 * @throws Will throw if no account is provided
 * @throws Will throw if the network is unsupported
 * @throws Will throw if contract addresses are not available
 * @throws Will throw if the transaction simulation fails
 * @throws Will throw and properly format any contract-related errors
 *
 * @example
 * const hash = await bridgeAndCall(client, {
 *   address: '0x...',
 *   abi: contractAbi,
 *   functionName: 'someFunction',
 *   args: [arg1, arg2]
 * }, parseEther('0.1'));
 */
export async function bridgeAndCall<
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
  >,
  ethValue: bigint,
  config?: BridgeAndCallConfig
): Promise<WriteContractReturnType> {
  const {
    abi,
    account: account_ = client.account,
    address,
    args,
    functionName,
  } = parameters as WriteContractParameters;

  if (typeof account_ === "undefined") throw new Error("No account");
  const account = account_ ? parseAccount(account_) : null;

  const data = encodeFunctionData({
    abi,
    args,
    functionName,
  } as EncodeFunctionDataParameters);

  try {
    const { l1Network, l2Network } = (() => {
      switch (client.chain?.id) {
        case mainnet.id:
        case facetMainnet.id:
          return { l1Network: mainnet, l2Network: facetMainnet };
        case sepolia.id:
        case facetSepolia.id:
          return { l1Network: sepolia, l2Network: facetSepolia };
        default:
          return { l1Network: undefined, l2Network: undefined };
      }
    })();

    const { l1Contracts, l2Contracts } = (() => {
      if (!l1Network) {
        return { l1Contracts: undefined, l2Contracts: undefined };
      }

      const networkKey = l1Network.name === "Ethereum" ? "mainnet" : "sepolia";

      return {
        l1Contracts: {
          ...CONTRACT_ADDRESSES.l1[networkKey],
          ...(config?.contractAddresses?.l1?.[networkKey] ?? {}),
        },
        l2Contracts: {
          ...CONTRACT_ADDRESSES.l2[networkKey],
          ...(config?.contractAddresses?.l2?.[networkKey] ?? {}),
        },
      };
    })();

    if (!l2Network || !l1Network) throw new Error("Unsupported network");
    if (!l1Contracts || !l2Contracts)
      throw new Error("Contract addresses not available");

    const fctMintRate = await getFctMintRate(l1Network.id);

    const zippedData = LibZip.cdCompress(data) as `0x${string}`;

    const gasLimit = 50000000n;

    const encodedFacetFunctionData = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "bridgeAndCall",
          inputs: [
            { type: "address" },
            { type: "uint256" },
            { type: "address" },
            { type: "bytes" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "bridgeAndCall",
      args: [account!.address, ethValue, address, zippedData ?? "0x"],
    });

    const facetPublicClient = createPublicClient({
      chain: l2Network,
      transport: http(),
    });

    const simulationTxn = await (facetPublicClient as any).request({
      method: "debug_traceCall",
      params: [
        {
          from: applyL1ToL2Alias(l1Contracts.ETHER_BRIDGE_CONTRACT),
          to: l2Contracts.WETH_CONTRACT,
          data: encodedFacetFunctionData,
          gas: toHex(gasLimit),
          value: "0x0",
        },
        "latest",
        {
          stateOverrides: {
            [applyL1ToL2Alias(l1Contracts.ETHER_BRIDGE_CONTRACT)]: {
              balance: toHex(maxUint256),
            },
          },
        },
      ],
    });

    if (simulationTxn.structLogs.find((log: any) => log.op === "REVERT")) {
      throw Error("Failed to create transaction.");
    }

    const transactionData = [
      toHex(l2Network.id),
      l2Contracts.WETH_CONTRACT,
      "0x" as Hex,
      toHex(gasLimit),
      encodedFacetFunctionData,
      "0x" as Hex,
    ];

    const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

    const inputCost = BigInt(toBytes(encodedTransaction).byteLength) * 8n;
    const fctMintAmount = inputCost * fctMintRate;

    const l1TxnData = encodeFunctionData({
      abi: etherBridgeAbi,
      args: [account!.address, address, zippedData, gasLimit],
      functionName: "bridgeAndCall",
    } as EncodeFunctionDataParameters);

    const l1TransactionHash = await sendTransaction(client, {
      to: l1Contracts.ETHER_BRIDGE_CONTRACT,
      chain: client.chain as Chain | null | undefined,
      data: l1TxnData,
      value: ethValue,
      account: client.account ?? account!,
    });

    const facetTransactionHash = computeFacetTransactionHash(
      l1TransactionHash,
      applyL1ToL2Alias(l1Contracts.ETHER_BRIDGE_CONTRACT),
      l2Contracts.WETH_CONTRACT,
      0n,
      encodedFacetFunctionData,
      gasLimit,
      fctMintAmount
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
