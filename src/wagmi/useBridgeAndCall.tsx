"use client";

import {
  MutateOptions,
  MutationOptions,
  useMutation,
} from "@tanstack/react-query";
import {
  Config,
  getConnectorClient,
  ResolvedRegister,
  WriteContractReturnType,
} from "@wagmi/core";
import {
  Abi,
  ContractFunctionArgs,
  ContractFunctionName,
  WriteContractErrorType,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useConfig } from "wagmi";
import {
  UseMutationParameters,
  UseMutationReturnType,
  WriteContractData,
  WriteContractVariables,
} from "wagmi/query";

import { BridgeAndCallConfig } from "../types";
import { bridgeAndCall as viemBridgeAndCall } from "../viem/bridgeAndCall";

async function bridgeAndCall<
  config extends Config,
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  chainId extends config["chains"][number]["id"],
>(
  config: config,
  parameters: BridgeAndCallVariables<abi, functionName, args, config, chainId>
): Promise<WriteContractReturnType> {
  const {
    account,
    chainId,
    connector,
    __mode,
    ethValue,
    bridgeAndCallConfig,
    ...rest
  } = parameters;

  let client;
  if (typeof account === "object" && account?.type === "local")
    client = config.getClient({ chainId });
  else
    client = await getConnectorClient(config, {
      account: account ?? undefined,
      chainId,
      connector,
    });

  if (client.chain.id !== mainnet.id && client.chain.id !== sepolia.id) {
    throw new Error("Connect to mainnet or sepolia");
  }

  const hash = await viemBridgeAndCall(
    client,
    {
      ...(rest as any),
      ...(account ? { account } : {}),
      chain: chainId ? { id: chainId } : null,
    },
    ethValue,
    bridgeAndCallConfig
  );

  return hash;
}

function bridgeAndCallMutationOptions<config extends Config>(config: config) {
  return {
    mutationFn(variables) {
      return bridgeAndCall(config, variables);
    },
    mutationKey: ["bridgeAndCall"],
  } as const satisfies MutationOptions<
    WriteContractData,
    WriteContractErrorType,
    BridgeAndCallVariables<
      Abi,
      string,
      readonly unknown[],
      config,
      config["chains"][number]["id"]
    >
  >;
}

type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined;
};

type UseBridgeAndCallParameters<
  config extends Config = Config,
  context = unknown,
> = ConfigParameter<config> & {
  mutation?:
    | UseMutationParameters<
        WriteContractData,
        WriteContractErrorType,
        BridgeAndCallVariables<
          Abi,
          string,
          readonly unknown[],
          config,
          config["chains"][number]["id"]
        >,
        context
      >
    | undefined;
};

type BridgeAndCallVariables<
  abi extends Abi | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<
    abi,
    "nonpayable" | "payable"
  > = ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  > = ContractFunctionArgs<abi, "nonpayable" | "payable", functionName>,
  config extends Config = Config,
  chainId extends
    config["chains"][number]["id"] = config["chains"][number]["id"],
  ///
  allFunctionNames = ContractFunctionName<abi, "nonpayable" | "payable">,
> = WriteContractVariables<
  abi,
  functionName,
  args,
  config,
  chainId,
  allFunctionNames
> & {
  ethValue: bigint;
  bridgeAndCallConfig?: BridgeAndCallConfig;
};

export type BridgeAndCallMutate<config extends Config, context = unknown> = <
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  chainId extends config["chains"][number]["id"],
>(
  variables: BridgeAndCallVariables<abi, functionName, args, config, chainId>,
  options?:
    | MutateOptions<
        WriteContractData,
        WriteContractErrorType,
        BridgeAndCallVariables<
          abi,
          functionName,
          args,
          config,
          chainId,
          // use `functionName` to make sure it's not union of all possible function names
          functionName
        >,
        context
      >
    | undefined
) => void;

export type BridgeAndCallMutateAsync<
  config extends Config,
  context = unknown,
> = <
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  chainId extends config["chains"][number]["id"],
>(
  variables: BridgeAndCallVariables<abi, functionName, args, config, chainId>,
  options?:
    | MutateOptions<
        WriteContractData,
        WriteContractErrorType,
        BridgeAndCallVariables<
          abi,
          functionName,
          args,
          config,
          chainId,
          // use `functionName` to make sure it's not union of all possible function names
          functionName
        >,
        context
      >
    | undefined
) => Promise<WriteContractData>;

type UseBridgeAndCallReturnType<
  config extends Config = Config,
  context = unknown,
> = UseMutationReturnType<
  WriteContractData,
  WriteContractErrorType,
  BridgeAndCallVariables<
    Abi,
    string,
    readonly unknown[],
    config,
    config["chains"][number]["id"]
  >,
  context
> & {
  bridgeAndCall: BridgeAndCallMutate<config, context>;
  bridgeAndCallAsync: BridgeAndCallMutateAsync<config, context>;
};

/**
 * React hook that provides functionality to bridge and write to a Facet contract.
 *
 * @template config - The wagmi Config type, defaults to ResolvedRegister["config"]
 * @template context - The context type for the mutation, defaults to unknown
 *
 * @param {UseBridgeAndCallParameters<config, context>} parameters - Configuration options
 * @param {Config | config | undefined} [parameters.config] - Optional wagmi configuration
 * @param {UseMutationParameters} [parameters.mutation] - Optional react-query mutation parameters
 *
 * @returns {UseBridgeAndCallReturnType<config, context>} Object containing:
 *   - bridgeAndCall: Function to execute the contract write (non-async)
 *   - bridgeAndCallAsync: Function to execute the contract write (async)
 *   - Additional react-query mutation properties (isLoading, isSuccess, etc.)
 */
export function useBridgeAndCall<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>(
  parameters: UseBridgeAndCallParameters<config, context> = {}
): UseBridgeAndCallReturnType<config, context> {
  const { mutation } = parameters;

  const config = useConfig(parameters);

  const mutationOptions = bridgeAndCallMutationOptions(config);

  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  });

  type Return = UseBridgeAndCallReturnType<config, context>;
  return {
    ...result,
    bridgeAndCall: mutate as Return["bridgeAndCall"],
    bridgeAndCallAsync: mutateAsync as Return["bridgeAndCallAsync"],
  };
}
