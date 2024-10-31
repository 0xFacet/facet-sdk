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
        address: "0xDf9aF3B2e9617D53FD2E0096859ec7f4db6c96c9",
      },
    },
    portal: {
      [sepolia.id]: {
        address: "0x34936f885d551C5f887Ed50bDc02eEB89F015930",
      },
    },
    l1StandardBridge: {
      [sepolia.id]: {
        address: "0x46787ffeC1be4dc1c9D8eaD9dE3B83E41063C772",
      },
    },
  },
  sourceId: sepolia.id,
});

// Facet Mainnet Configuration
export const facetMainnet = defineChain({
  ...chainConfig,
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
  },
  sourceId: mainnet.id,
});
