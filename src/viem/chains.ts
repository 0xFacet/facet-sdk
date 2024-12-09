import { defineChain } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { chainConfig } from "viem/op-stack";

// Facet Sepolia Testnet Configuration
export const facetSepolia = defineChain({
  id: 0xface7a,
  name: "Facet Sepolia",
  nativeCurrency: { name: "Facet Compute Token", symbol: "FCT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://sepolia.facet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://sepolia.explorer.facet.org",
    },
  },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [sepolia.id]: {
        address: "0x0ABE7852CfbF73963F6ae419a500CC04785d6a30",
      },
    },
    portal: {
      [sepolia.id]: {
        address: "0xF409695e35a73012760aBb8eD3c2a0b3F4e9354A",
      },
    },
    l1StandardBridge: {
      [sepolia.id]: {
        address: "0xEe49E40B2ef8C98011DB5B4999D93E8B766a7241",
      },
    },
  },
  sourceId: sepolia.id,
});

// Facet Mainnet Configuration
export const facetMainnet = defineChain({
  id: 0xface7,
  name: "Facet Mainnet",
  nativeCurrency: { name: "Facet Compute Token", symbol: "FCT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://mainnet.facet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.facet.org",
    },
  },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [sepolia.id]: {
        address: "" as any,
      },
    },
    portal: {
      [sepolia.id]: {
        address: "" as any,
      },
    },
    l1StandardBridge: {
      [sepolia.id]: {
        address: "" as any,
      },
    },
  },
  sourceId: mainnet.id,
});
