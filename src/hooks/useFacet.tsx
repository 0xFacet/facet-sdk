import { getPublicClient, getWalletClient } from "@wagmi/core";
import React, { useCallback, useMemo } from "react";
import { LibZip } from "solady";
import type {
  AbiFunction,
  AbiParameter,
  AbiStateMutability,
  Hex,
  PublicClient,
  TransactionReceipt,
} from "viem";
import {
  concatHex,
  encodeFunctionData,
  getAddress,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useAccount, useConfig } from "wagmi";

import { etherBridgeAbi, facetEtherBridgeMintableAbi } from "../constants/abi";
import { CONTRACT_ADDRESSES } from "../constants/addresses";
import {
  FacetConfig,
  FacetResult,
  FacetTransactionParams,
  FacetTransactionStatus,
  ReadParams,
  WriteParams,
} from "../types";
import { computeFacetTransactionHash } from "../utils";
import { applyL1ToL2Alias } from "../utils/aliasing";
import { facetMainnet, facetSepolia } from "../viem/chains";
import { createFacetPublicClient } from "../viem/createFacetPublicClient";
import { getFctMintRate } from "../viem/getFctMintRate";
import { sendFacetTransaction } from "../viem/sendFacetTransaction";

const TRANSACTION_DEFAULTS = {
  pollingInterval: 12_000,
  timeout: 60_000,
  gasLimitMultiplier: 1.1,
} as const;

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
 * @param {FacetConfig} [config] - Optional configuration for the Facet hook
 * @returns {FacetResult} Object containing functions to interact with the Facet network
 */
export function useFacet(config?: FacetConfig): FacetResult {
  const { address, isDisconnected, chain, connector } = useAccount();
  const wagmiConfig = useConfig();

  const { l1Network, l2Network } = useMemo(() => {
    switch (chain?.id) {
      case mainnet.id:
      case facetMainnet.id:
        return { l1Network: mainnet, l2Network: facetMainnet };
      case sepolia.id:
      case facetSepolia.id:
        return { l1Network: sepolia, l2Network: facetSepolia };
      default:
        return { l1Network: undefined, l2Network: undefined };
    }
  }, [chain]);

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
    return createFacetPublicClient(l1Network.id) as PublicClient;
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
   * Performs a read operation on the Facet network
   * @template T - The return type of the read operation
   * @param {ReadParams & { blockNumber?: bigint }} params - Parameters for the read operation
   * @param {string} params.to - The address of the contract to read from
   * @param {AbiFunction} params.functionAbi - The ABI of the function to call
   * @param {any[]} [params.args] - Arguments to pass to the function
   * @param {bigint} [params.blockNumber] - Optional block number to read from
   * @returns {Promise<T>} The result of the read operation
   * @throws {Error} If the network is unsupported or the connection is invalid
   */
  const sendFacetMethodRead = useCallback(
    async function sendFacetMethodRead<T = any>({
      to,
      functionAbi,
      args = [],
      blockNumber,
    }: ReadParams & { blockNumber?: bigint }): Promise<T> {
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (chain?.id !== l1Network.id) throw new Error("Wrong network");
      if (!facetPublicClient) throw new Error("Facet network not found");

      return facetPublicClient.readContract({
        abi: [functionAbi],
        address: getAddress(to),
        functionName: functionAbi.name,
        args,
        blockNumber,
      }) as Promise<T>;
    },
    [chain?.id, facetPublicClient, l1Network, l2Network]
  );

  /**
   * Sends a raw transaction to the Facet network
   * @param {FacetTransactionParams} transaction - The transaction parameters
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @throws {Error} If the user is not connected or the network is unsupported
   */
  const sendRawFacetTransaction = useCallback(
    async (transaction: FacetTransactionParams) => {
      if (!address || isDisconnected) throw new Error("Not connected");
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (chain?.id !== l1Network.id) throw new Error("Wrong network");
      if (!facetPublicClient) throw new Error("Facet network not found");

      const l1WalletClient = await getWalletClient(wagmiConfig);

      const { facetTransactionHash } = await sendFacetTransaction(
        l1WalletClient,
        transaction
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
      address,
      isDisconnected,
      l2Network,
      l1Network,
      chain?.id,
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
      if (!address || isDisconnected) throw new Error("Not connected");
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (chain?.id !== l1Network.id) throw new Error("Wrong network");
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
        args: [address, ethValue, transaction.to, transaction.data],
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
      if (connector?.id !== "coinbaseWalletSDK") {
        const l1PublicClient = getPublicClient(wagmiConfig, {
          chainId: l1Network?.id,
        });

        if (!l1PublicClient || !l1Network) {
          throw Error(
            "Could not get public network or L1 network is undefined."
          );
        }

        estimatedGas = await l1PublicClient.estimateContractGas({
          account: address,
          address: l1Contracts.ETHER_BRIDGE_CONTRACT,
          abi: etherBridgeAbi,
          functionName: "bridgeAndCall",
          args: [address, transaction.to, transaction.data, gasLimit],
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
        args: [address, transaction.to, transaction.data, gasLimit],
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
      address,
      isDisconnected,
      l2Network,
      l1Network,
      chain?.id,
      facetPublicClient,
      l1Contracts,
      l2Contracts,
      wagmiConfig,
      connector?.id,
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

      return sendRawFacetTransaction({
        to: l2Contracts.BUDDY_FACTORY_CONTRACT,
        data: encodedFunctionData,
      });
    },
    [l2Contracts, sendRawFacetTransaction]
  );

  /**
   * Executes a write operation on the Facet network
   * @param {WriteParams} params - Parameters for the write operation
   * @param {string} params.to - The address of the contract to write to
   * @param {AbiFunction} params.functionAbi - The ABI of the function to call
   * @param {any[]} [params.args] - Arguments to pass to the function
   * @param {bigint} [params.ethValue] - Optional ETH value to send with the transaction
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @throws {Error} If contract addresses are not available
   */
  const sendFacetMethodWrite = React.useCallback(
    async ({ to, functionAbi, args = [], ethValue }: WriteParams) => {
      if (!l2Contracts) throw new Error("Contract addresses not available");

      const encodedFunctionData = encodeFunctionData({
        abi: [functionAbi],
        functionName: functionAbi.name,
        args,
      });

      const l2WethBalance = await sendFacetMethodRead<bigint>({
        to: l2Contracts.WETH_CONTRACT,
        functionAbi: facetEtherBridgeMintableAbi.find(
          (abi) => abi.name === "balanceOf"
        ) as AbiFunction,
        args: [address],
      });

      if (ethValue) {
        if (ethValue > BigInt(l2WethBalance ?? 0)) {
          return sendBridgeAndCallTransaction(
            {
              to: getAddress(to),
              data: encodedFunctionData,
            },
            ethValue
          );
        }
        return sendFacetBuddyTransaction(
          {
            to: getAddress(to),
            data: encodedFunctionData,
          },
          ethValue
        );
      }
      return sendRawFacetTransaction({
        to: getAddress(to),
        data: encodedFunctionData,
      });
    },
    [
      l2Contracts,
      sendFacetMethodRead,
      address,
      sendRawFacetTransaction,
      sendFacetBuddyTransaction,
      sendBridgeAndCallTransaction,
    ]
  );

  /**
   * Simulates a write operation on the Facet network without executing it
   * @template T - The return type of the simulation
   * @param {WriteParams & { blockNumber?: bigint }} params - Parameters for the simulation
   * @param {string} params.to - The address of the contract to simulate against
   * @param {AbiFunction} params.functionAbi - The ABI of the function to simulate
   * @param {any[]} [params.args] - Arguments to pass to the function
   * @param {bigint} [params.blockNumber] - Optional block number to simulate at
   * @returns {Promise<T>} The result of the simulation
   * @throws {Error} If the user is not connected or the network is unsupported
   */
  const simulateFacetMethodWrite = React.useCallback(
    async function simulateFacetMethodWrite<T = any>({
      to,
      functionAbi,
      args = [],
      blockNumber,
    }: WriteParams & { blockNumber?: bigint }): Promise<T> {
      if (!address || isDisconnected) throw new Error("Not connected");
      if (!l2Network || !l1Network) throw new Error("Unsupported network");
      if (chain?.id !== l1Network.id) throw new Error("Wrong network");
      if (!facetPublicClient) throw new Error("Facet network not found");

      return facetPublicClient.simulateContract({
        account: address,
        abi: [functionAbi],
        address: to,
        functionName: functionAbi.name,
        args,
        blockNumber,
      }) as Promise<T>;
    },
    [
      address,
      chain?.id,
      facetPublicClient,
      isDisconnected,
      l1Network,
      l2Network,
    ]
  );

  return {
    sendRawFacetTransaction,
    sendFacetMethodWrite,
    sendFacetMethodRead,
    simulateFacetMethodWrite,
  };
}
