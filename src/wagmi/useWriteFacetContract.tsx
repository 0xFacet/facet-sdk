import { MutationOptions, useMutation } from "@tanstack/react-query";
import {
  Config,
  getConnectorClient,
  ResolvedRegister,
  simulateContract,
  WriteContractParameters,
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
  WriteContractMutate,
  WriteContractMutateAsync,
  WriteContractVariables,
} from "wagmi/query";

import { writeFacetContract as viemWriteFacetContract } from "../viem/writeFacetContract";

async function writeFacetContract<
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
  parameters: WriteContractParameters<abi, functionName, args, config, chainId>
): Promise<WriteContractReturnType> {
  const { account, chainId, connector, __mode, ...rest } = parameters;

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
    throw new Error("Connect to mainnet and sepolia");
  }

  let request;
  if (__mode === "prepared") request = rest;
  else {
    const { request: simulateRequest } = await simulateContract(config, {
      ...rest,
      account,
      chainId: client.chain.id === mainnet.id ? 0xface7 : 0xface7a,
    } as any);
    request = simulateRequest;
  }

  const hash = await viemWriteFacetContract(client, {
    ...(request as any),
    ...(account ? { account } : {}),
    chain: chainId ? { id: chainId } : null,
  });

  return hash;
}

function writeFacetContractMutationOptions<config extends Config>(
  config: config
) {
  return {
    mutationFn(variables) {
      return writeFacetContract(config, variables);
    },
    mutationKey: ["writeContract"],
  } as const satisfies MutationOptions<
    WriteContractData,
    WriteContractErrorType,
    WriteContractVariables<
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

type UseWriteFacetContractParameters<
  config extends Config = Config,
  context = unknown,
> = ConfigParameter<config> & {
  mutation?:
    | UseMutationParameters<
        WriteContractData,
        WriteContractErrorType,
        WriteContractVariables<
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

type UseWriteFacetContractReturnType<
  config extends Config = Config,
  context = unknown,
> = UseMutationReturnType<
  WriteContractData,
  WriteContractErrorType,
  WriteContractVariables<
    Abi,
    string,
    readonly unknown[],
    config,
    config["chains"][number]["id"]
  >,
  context
> & {
  writeFacetContract: WriteContractMutate<config, context>;
  writeFacetContractAsync: WriteContractMutateAsync<config, context>;
};

/**
 * React hook that provides functionality to write to a Facet contract.
 *
 * @template config - The wagmi Config type, defaults to ResolvedRegister["config"]
 * @template context - The context type for the mutation, defaults to unknown
 *
 * @param {UseWriteFacetContractParameters<config, context>} parameters - Configuration options
 * @param {Config | config | undefined} [parameters.config] - Optional wagmi configuration
 * @param {UseMutationParameters} [parameters.mutation] - Optional react-query mutation parameters
 *
 * @returns {UseWriteFacetContractReturnType<config, context>} Object containing:
 *   - writeFacetContract: Function to execute the contract write (non-async)
 *   - writeFacetContractAsync: Function to execute the contract write (async)
 *   - Additional react-query mutation properties (isLoading, isSuccess, etc.)
 */
export function useWriteFacetContract<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>(
  parameters: UseWriteFacetContractParameters<config, context> = {}
): UseWriteFacetContractReturnType<config, context> {
  const { mutation } = parameters;

  const config = useConfig(parameters);

  const mutationOptions = writeFacetContractMutationOptions(config);

  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  });

  type Return = UseWriteFacetContractReturnType<config, context>;
  return {
    ...result,
    writeFacetContract: mutate as Return["writeFacetContract"],
    writeFacetContractAsync: mutateAsync as Return["writeFacetContractAsync"],
  };
}
