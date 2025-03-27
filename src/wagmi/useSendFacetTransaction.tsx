"use client";

import { MutationOptions, useMutation } from "@tanstack/react-query";
import {
  getConnectorClient,
  ResolvedRegister,
  SendTransactionErrorType,
  SendTransactionParameters,
  SendTransactionReturnType,
} from "@wagmi/core";
import { Evaluate, Hex } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { Config, useConfig } from "wagmi";
import {
  SendTransactionData,
  SendTransactionMutate,
  SendTransactionMutateAsync,
  SendTransactionVariables,
  UseMutationParameters,
  UseMutationReturnType,
} from "wagmi/query";

import { sendFacetTransaction } from "../viem/sendFacetTransaction";

// Define the extended variables type with mineBoost
type SendFacetTransactionVariables<
  config extends Config,
  chainId extends config["chains"][number]["id"],
> = SendTransactionVariables<config, chainId> & {
  mineBoost?: Hex;
};

async function sendTransaction<
  config extends Config,
  chainId extends config["chains"][number]["id"],
>(
  config: config,
  parameters: SendTransactionParameters<config, chainId> & {
    mineBoost?: Hex;
  }
): Promise<SendTransactionReturnType> {
  const {
    account,
    chainId,
    connector,
    gas: gas_,
    mineBoost,
    ...rest
  } = parameters;

  let client;
  if (typeof account === "object" && account?.type === "local")
    client = config.getClient({ chainId });
  else
    client = await getConnectorClient(config, { account, chainId, connector });

  if (client.chain.id !== mainnet.id && client.chain.id !== sepolia.id) {
    throw new Error("Connect to mainnet or sepolia");
  }

  const hash = await sendFacetTransaction(client, {
    ...(rest as any),
    ...(account ? { account } : {}),
    chain: chainId ? { id: chainId } : null,
    mineBoost,
  });

  return hash;
}

function sendTransactionMutationOptions<config extends Config>(config: config) {
  return {
    mutationFn(variables) {
      return sendTransaction(config, variables);
    },
    mutationKey: ["sendTransaction"],
  } as const satisfies MutationOptions<
    SendTransactionData,
    SendTransactionErrorType,
    SendFacetTransactionVariables<config, config["chains"][number]["id"]>
  >;
}

type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined;
};

type UseSendFacetTransactionParameters<
  config extends Config = Config,
  context = unknown,
> = Evaluate<
  ConfigParameter<config> & {
    mutation?:
      | UseMutationParameters<
          SendTransactionData,
          SendTransactionErrorType,
          SendFacetTransactionVariables<config, config["chains"][number]["id"]>,
          context
        >
      | undefined;
  }
>;

type UseSendFacetTransactionReturnType<
  config extends Config = Config,
  context = unknown,
> = Evaluate<
  UseMutationReturnType<
    SendTransactionData,
    SendTransactionErrorType,
    SendFacetTransactionVariables<config, config["chains"][number]["id"]>,
    context
  > & {
    sendFacetTransaction: SendTransactionMutate<config, context>;
    sendFacetTransactionAsync: SendTransactionMutateAsync<config, context>;
  }
>;

/**
 * Hook for sending Facet transactions on Ethereum mainnet or Sepolia testnet.
 *
 * This hook provides a convenient way to send transactions through the Facet SDK
 * using wagmi and viem. It supports both synchronous and asynchronous transaction
 * submission methods.
 *
 * @template config - The wagmi Config type
 * @template context - The mutation context type
 *
 * @param {UseSendFacetTransactionParameters<config, context>} parameters - Configuration options
 * @param {config} [parameters.config] - The wagmi config to use
 * @param {UseMutationParameters} [parameters.mutation] - React Query mutation options
 *
 * @returns {UseSendFacetTransactionReturnType<config, context>} - Mutation result and transaction methods
 * @returns {SendTransactionMutate<config, context>} returns.sendFacetTransaction - Function to send a transaction
 * @returns {SendTransactionMutateAsync<config, context>} returns.sendFacetTransactionAsync - Function to send a transaction that returns a promise
 *
 * @throws Will throw an error if connected to a chain other than mainnet or Sepolia
 *
 * @example
 * const { sendFacetTransaction, isLoading, isSuccess, data } = useSendFacetTransaction();
 *
 * // Send a transaction
 * sendFacetTransaction({
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...',
 *   mineBoost: '0x01' // Optional: increase FCT mining amount
 * });
 */
export function useSendFacetTransaction<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>(
  parameters: UseSendFacetTransactionParameters<config, context> = {}
): UseSendFacetTransactionReturnType<config, context> {
  const { mutation } = parameters;

  const config = useConfig(parameters);

  const mutationOptions = sendTransactionMutationOptions(config);
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  });

  type Return = UseSendFacetTransactionReturnType<config, context>;
  return {
    ...result,
    sendFacetTransaction: mutate as Return["sendFacetTransaction"],
    sendFacetTransactionAsync:
      mutateAsync as Return["sendFacetTransactionAsync"],
  };
}
