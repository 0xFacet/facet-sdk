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
        address: "0xa91a34AEeA2924dB624d58Cf85a1F547497b242A",
      },
    },
    portal: {
      [sepolia.id]: {
        address: "0x37c9F12A1BEA2671317e06e674Ba9802422b6390",
      },
    },
    l1StandardBridge: {
      [sepolia.id]: {
        address: "0x4F4Adc6FCC8d910C4bBC8f3749d4a48A74F2ea78",
      },
    },
  },
  sourceId: mainnet.id,
});
