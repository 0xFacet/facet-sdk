import { getPublicClient, getWalletClient } from "@wagmi/core";
import React, { useMemo } from "react";
import { LibZip } from "solady";
import type { Hex, PublicClient } from "viem";
import {
  concatHex,
  createPublicClient,
  encodeFunctionData,
  http,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
  zeroAddress,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useAccount, useConfig } from "wagmi";

import { etherBridgeAbi } from "../constants/abi";
import { CONTRACT_ADDRESSES } from "../constants/addresses";
import { FacetTransactionParams } from "../types";
import { computeFacetTransactionHash } from "../utils";
import { applyL1ToL2Alias } from "../utils/aliasing";
import { getFctMintRate } from "../utils/getFctMintRate";
import { facetMainnet, facetSepolia } from "../viem/chains";

interface BridgeAndCallHookConfig {
  /** Override default contract addresses */
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}

/**
 * Hook for bridging ETH from L1 to L2 and executing calls on Facet network
 * @param config - Optional configuration for the hook
 * @returns Function to bridge ETH and execute calls on L2
 */
export function useBridgeAndCall(config?: BridgeAndCallHookConfig) {
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
   * Bridges ETH from L1 to L2 and executes a call on L2
   * @param _transaction - The transaction parameters for L2
   * @param ethValue - The amount of ETH to bridge
   * @returns The L2 transaction hash
   * @throws If the user is not connected or the network is unsupported
   */
  const bridgeAndCall = React.useCallback(
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
        args: [
          account.address,
          ethValue,
          transaction.to ?? zeroAddress,
          transaction.data ?? "0x",
        ],
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
          args: [account.address, transaction.to!, transaction.data!, gasLimit],
          value: ethValue,
        });

        estimatedGas = BigInt(Math.floor(Number(estimatedGas) * 1.1));
      }

      const l1TransactionHash = await l1WalletClient.writeContract({
        address: l1Contracts.ETHER_BRIDGE_CONTRACT,
        abi: etherBridgeAbi,
        functionName: "bridgeAndCall",
        args: [account.address, transaction.to!, transaction.data!, gasLimit],
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

      return facetTransactionHash;
    },
    [
      account.address,
      account.chain?.id,
      account.connector?.id,
      account.isDisconnected,
      facetPublicClient,
      l1Contracts,
      l1Network,
      l2Contracts,
      l2Network,
      wagmiConfig,
    ]
  );

  return bridgeAndCall;
}
