import { AbiFunction, Address } from "viem";

export interface WriteParams {
  to: Address;
  functionAbi: AbiFunction;
  args?: readonly unknown[] | undefined;
  ethValue?: bigint;
}

export interface ReadParams {
  to: Address;
  functionAbi: AbiFunction;
  args?: readonly unknown[] | undefined;
}

export interface ContractAddresses {
  l1: Record<
    "mainnet" | "sepolia",
    {
      ETHER_BRIDGE_CONTRACT: Address;
    }
  >;
  l2: Record<
    "mainnet" | "sepolia",
    {
      BUDDY_FACTORY_CONTRACT: Address;
      L1_BLOCK_CONTRACT: Address;
      WETH_CONTRACT: Address;
    }
  >;
}
