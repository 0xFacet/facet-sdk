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
      [mainnet.id]: {
        address: "0xD1e4cf142fDf7688A9f7734A5eE74d079696C5A6",
      },
    },
    portal: {
      [mainnet.id]: {
        address: "0x8649Db4A287413567E8dc0EBe1dd62ee02B71eDD",
      },
    },
    l1StandardBridge: {
      [mainnet.id]: {
        address: "0x8F75466D69a52EF53C7363F38834bEfC027A2909",
      },
    },
  },
  sourceId: mainnet.id,
});
