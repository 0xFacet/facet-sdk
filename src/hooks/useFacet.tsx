import { getPublicClient, getWalletClient } from "@wagmi/core";
import React, { useCallback, useMemo } from "react";
import { LibZip } from "solady";
import type {
  AbiFunction,
  AbiParameter,
  AbiStateMutability,
  Address,
  Hex,
  PublicClient,
  TransactionReceipt,
} from "viem";
import {
  concatHex,
  createPublicClient,
  encodeFunctionData,
  http,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useAccount, useConfig } from "wagmi";

import { etherBridgeAbi, facetEtherBridgeMintableAbi } from "../constants/abi";
import { CONTRACT_ADDRESSES } from "../constants/addresses";
import { FacetTransactionParams } from "../types";
import { buildFacetTransaction, computeFacetTransactionHash } from "../utils";
import { applyL1ToL2Alias } from "../utils/aliasing";
import { getFctMintRate } from "../utils/getFctMintRate";
import { facetMainnet, facetSepolia } from "../viem/chains";

const TRANSACTION_DEFAULTS = {
  pollingInterval: 12_000,
  timeout: 60_000,
  gasLimitMultiplier: 1.1,
} as const;

type FacetTransactionStatus =
  | { status: "pending"; hash: string; explorerUrl?: string }
  | {
      status: "success";
      hash: string;
      explorerUrl?: string;
      receipt: TransactionReceipt;
    }
  | { status: "error"; hash: string; explorerUrl?: string; error: Error };

interface WriteParams {
  address: Address;
  functionAbi: AbiFunction;
  args?: readonly unknown[] | undefined;
  ethValue?: bigint;
}

interface FacetHookConfig {
  /** Called when transaction status changes */
  onTransaction?: (params: FacetTransactionStatus) => void;
  /** Override default contract addresses */
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}

interface FacetHookReturn {
  /** Bridges ETH from L1 to L2 and executes a call on L2 */
  sendBridgeAndCallTransaction: (
    transaction: FacetTransactionParams,
    ethValue: bigint
  ) => Promise<TransactionReceipt>;
  /** Sends a transaction through the Buddy Factory contract */
  sendFacetBuddyTransaction: (
    transaction: FacetTransactionParams,
    ethValue: bigint
  ) => Promise<TransactionReceipt>;
  /** Sends a transaction to the Facet network */
  sendFacetTransaction: (
    transaction: FacetTransactionParams
  ) => Promise<TransactionReceipt>;
  /** Executes a write function on a contract on the Facet network */
  writeFacetContract: (params: WriteParams) => Promise<TransactionReceipt>;
}

/**
 * Creates an ABI function definition with the specified parameters
 * @param {string} functionName - The name of the function
 * @param {AbiParameter[]} inputs - Array of input parameters
 * @param {AbiParameter[]} outputs - Array of output parameters
 * @param {AbiStateMutability} stateMutability - The state mutability of the function
 * @returns {AbiFunction} The created ABI function definition
 */
export const createFunctionAbi = (
  functionName: string,
  inputs: AbiParameter[],
  outputs: AbiParameter[],
  stateMutability: AbiStateMutability
): AbiFunction => {
  return {
    type: "function",
    name: functionName,
    inputs,
    outputs,
    stateMutability,
  } as AbiFunction;
};

/**
 * Hook for interacting with the Facet network
 * @param {FacetHookConfig} [config] - Optional configuration for the Facet hook
 * @returns {FacetHookReturn} Object containing functions to interact with the Facet network
 */
export function useFacet(config?: FacetHookConfig): FacetHookReturn {
  const account = useAccount();
  const wagmiConfig = useConfig();

  const { l1Network, l2Network } = useMemo(() => {
    switch (account.chain?.id) {
      case mainnet.id:
      case facetMainnet.id:
        return { l1Network: mainnet, l2Network: facetMainnet };
      case sepolia.id:
      case facetSepolia.id:
        return { l1Network: sepolia, l2Network: facetSepolia };
      default:
        return { l1Network: undefined, l2Network: undefined };
    }
  }, [account.chain]);

  const { l1Contracts, l2Contracts } = useMemo(() => {
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
  }, [l1Network, config?.contractAddresses?.l1, config?.contractAddresses?.l2]);

  const facetPublicClient = useMemo(() => {
    if (!l1Network) return undefined;

    if (l1Network.id !== 1 && l1Network.id !== 11155111) {
      throw new Error("Invalid chain id");
    }

    return createPublicClient({
      chain: l1Network.id === 1 ? facetMainnet : facetSepolia,
      transport: http(),
    }) as PublicClient;
  }, [l1Network]);

  /**
   * Updates the status of a transaction and calls the onTransaction callback if provided
   * @param {string} hash - The transaction hash
   * @param {FacetTransactionStatus["status"]} status - The current status of the transaction
   * @param {TransactionReceipt} [receipt] - The transaction receipt (if available)
   * @param {Error} [error] - Any error that occurred during the transaction
   */
  const updateTransactionStatus = useCallback(
    (
      hash: string,
      status: FacetTransactionStatus["status"],
      receipt?: TransactionReceipt,
      error?: Error
    ) => {
      if (!config?.onTransaction || !facetPublicClient?.chain) return;

      const explorerUrl = facetPublicClient.chain.blockExplorers?.default?.url
        ? `${facetPublicClient.chain.blockExplorers.default.url}/tx/${hash}`
        : undefined;

      let statusUpdate: FacetTransactionStatus;

      if (status === "success") {
        statusUpdate = {
          status,
          hash,
          explorerUrl,
          receipt: receipt!,
        };
      } else if (status === "error") {
        statusUpdate = {
          status,
          hash,
          explorerUrl,
          error: error || new Error("Transaction failed"),
        };
      } else {
        statusUpdate = {
          status,
          hash,
          explorerUrl,
        };
      }

      config.onTransaction(statusUpdate);
    },
    [config, facetPublicClient]
  );

  /**
   * Sends a transaction to the Facet network
   * @param {FacetTransactionParams} transaction - The transaction parameters
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @throws {Error} If the user is not connected or the network is unsupported
   */
  const sendFacetTransaction = useCallback(
    async (transaction: FacetTransactionParams) => {
      if (!account.address || account.isDisconnected)
        throw new Error("Not connected");
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (account.chain?.id !== l1Network.id) throw new Error("Wrong network");
      if (!facetPublicClient) throw new Error("Facet network not found");

      const l1WalletClient = await getWalletClient(wagmiConfig);

      const { facetTransactionHash } = await buildFacetTransaction(
        l1WalletClient.chain.id,
        l1WalletClient.account.address,
        transaction,
        (l1Transaction) =>
          l1WalletClient.sendTransaction({
            ...l1Transaction,
            chain: l1Transaction.chainId === 1 ? mainnet : sepolia,
          })
      );

      updateTransactionStatus(facetTransactionHash, "pending");

      const l2TransactionReceipt =
        await facetPublicClient.waitForTransactionReceipt({
          hash: facetTransactionHash,
          pollingInterval: TRANSACTION_DEFAULTS.pollingInterval,
          timeout: TRANSACTION_DEFAULTS.timeout,
        });

      updateTransactionStatus(
        facetTransactionHash,
        l2TransactionReceipt.status === "success" ? "success" : "error",
        l2TransactionReceipt,
        l2TransactionReceipt.status !== "success"
          ? new Error("Transaction failed")
          : undefined
      );

      return l2TransactionReceipt;
    },
    [
      account.address,
      account.isDisconnected,
      l2Network,
      l1Network,
      account.chain?.id,
      facetPublicClient,
      wagmiConfig,
      updateTransactionStatus,
    ]
  );

  /**
   * Bridges ETH from L1 to L2 and executes a call on L2
   * @param {FacetTransactionParams} _transaction - The transaction parameters for L2
   * @param {bigint} ethValue - The amount of ETH to bridge
   * @returns {Promise<TransactionReceipt>} The L2 transaction receipt
   * @throws {Error} If the user is not connected or the network is unsupported
   */
  const sendBridgeAndCallTransaction = React.useCallback(
    async (_transaction: FacetTransactionParams, ethValue: bigint) => {
      const transaction = _transaction;
      if (!account.address || account.isDisconnected)
        throw new Error("Not connected");
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (account.chain?.id !== l1Network.id) throw new Error("Wrong network");
      if (!facetPublicClient) throw new Error("Facet network not found");
      if (!l1Contracts || !l2Contracts)
        throw new Error("Contract addresses not available");

      const l1WalletClient = await getWalletClient(wagmiConfig);

      if (
        l1WalletClient.chain?.id !== 1 &&
        l1WalletClient.chain?.id !== 11_155_111
      ) {
        throw new Error("Invalid L1 chain");
      }

      if (!l1WalletClient.account) {
        throw new Error("No account");
      }

      if (!facetPublicClient.chain) {
        throw new Error("L2 chain not configured");
      }

      const fctMintRate = await getFctMintRate(l1WalletClient.chain.id);

      if (transaction.data) {
        transaction.data = LibZip.cdCompress(transaction.data) as `0x${string}`;
      }

      const gasLimit = 50000000n;

      const encodedFacetFunctionData = encodeFunctionData({
        abi: [
          createFunctionAbi(
            "bridgeAndCall",
            [
              { type: "address" },
              { type: "uint256" },
              { type: "address" },
              { type: "bytes" },
            ],
            [],
            "nonpayable"
          ),
        ],
        functionName: "bridgeAndCall",
        args: [account.address, ethValue, transaction.to, transaction.data],
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

      let estimatedGas: bigint | undefined;

      // There is a bug in Coinbase Wallet with estimating gas
      if (account.connector?.id !== "coinbaseWalletSDK") {
        const l1PublicClient = getPublicClient(wagmiConfig, {
          chainId: l1Network?.id,
        });

        if (!l1PublicClient || !l1Network) {
          throw Error(
            "Could not get public network or L1 network is undefined."
          );
        }

        estimatedGas = await l1PublicClient.estimateContractGas({
          account: account.address,
          address: l1Contracts.ETHER_BRIDGE_CONTRACT,
          abi: etherBridgeAbi,
          functionName: "bridgeAndCall",
          args: [account.address, transaction.to, transaction.data, gasLimit],
          value: ethValue,
        });

        estimatedGas = BigInt(
          Math.floor(
            Number(estimatedGas) * TRANSACTION_DEFAULTS.gasLimitMultiplier
          )
        );
      }

      const l1TransactionHash = await l1WalletClient.writeContract({
        address: l1Contracts.ETHER_BRIDGE_CONTRACT,
        abi: etherBridgeAbi,
        functionName: "bridgeAndCall",
        args: [account.address, transaction.to, transaction.data, gasLimit],
        value: ethValue,
        gas: estimatedGas,
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

      updateTransactionStatus(facetTransactionHash, "pending");

      const l2TransactionReceipt =
        await facetPublicClient.waitForTransactionReceipt({
          hash: facetTransactionHash,
          pollingInterval: TRANSACTION_DEFAULTS.pollingInterval,
          timeout: TRANSACTION_DEFAULTS.timeout,
        });

      updateTransactionStatus(
        facetTransactionHash,
        l2TransactionReceipt.status === "success" ? "success" : "error",
        l2TransactionReceipt,
        l2TransactionReceipt.status !== "success"
          ? new Error("Transaction failed")
          : undefined
      );

      return l2TransactionReceipt;
    },
    [
      account.address,
      account.isDisconnected,
      l2Network,
      l1Network,
      account.chain?.id,
      facetPublicClient,
      l1Contracts,
      l2Contracts,
      wagmiConfig,
      account.connector?.id,
      updateTransactionStatus,
    ]
  );

  /**
   * Sends a transaction through the Buddy Factory contract
   * @param {FacetTransactionParams} transaction - The transaction parameters
   * @param {bigint} ethValue - The amount of ETH to use in the transaction
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @throws {Error} If contract addresses are not available
   */
  const sendFacetBuddyTransaction = React.useCallback(
    async (transaction: FacetTransactionParams, ethValue: bigint) => {
      if (!l2Contracts) throw new Error("Contract addresses not available");

      const encodedFunctionData = encodeFunctionData({
        abi: [
          createFunctionAbi(
            "callBuddyForUser",
            [{ type: "uint256" }, { type: "address" }, { type: "bytes" }],
            [],
            "nonpayable"
          ),
        ],
        functionName: "callBuddyForUser",
        args: [ethValue, transaction.to, transaction.data],
      });

      return sendFacetTransaction({
        to: l2Contracts.BUDDY_FACTORY_CONTRACT,
        data: encodedFunctionData,
      });
    },
    [l2Contracts, sendFacetTransaction]
  );

  /**
   * Executes a write function on a contract on the Facet network
   * @param {WriteParams} params - Parameters for the write operation
   * @param {string} params.to - The address of the contract to write to
   * @param {AbiFunction} params.functionAbi - The ABI of the function to call
   * @param {any[]} [params.args] - Arguments to pass to the function
   * @param {bigint} [params.ethValue] - Optional ETH value to send with the transaction
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @throws {Error} If contract addresses are not available
   */
  const writeFacetContract = React.useCallback(
    async ({ address, functionAbi, args = [], ethValue }: WriteParams) => {
      if (!l2Contracts) throw new Error("Contract addresses not available");

      const encodedFunctionData = encodeFunctionData({
        abi: [functionAbi],
        functionName: functionAbi.name,
        args,
      });

      const l2WethBalance = (await facetPublicClient?.readContract({
        address: l2Contracts.WETH_CONTRACT,
        abi: facetEtherBridgeMintableAbi,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint;

      if (ethValue) {
        if (ethValue > BigInt(l2WethBalance ?? 0)) {
          return sendBridgeAndCallTransaction(
            {
              to: address,
              data: encodedFunctionData,
            },
            ethValue
          );
        }
        return sendFacetBuddyTransaction(
          {
            to: address,
            data: encodedFunctionData,
          },
          ethValue
        );
      }
      return sendFacetTransaction({
        to: address,
        data: encodedFunctionData,
      });
    },
    [
      l2Contracts,
      facetPublicClient,
      account.address,
      sendFacetTransaction,
      sendFacetBuddyTransaction,
      sendBridgeAndCallTransaction,
    ]
  );

  return {
    sendBridgeAndCallTransaction,
    sendFacetBuddyTransaction,
    sendFacetTransaction,
    writeFacetContract,
  };
}
