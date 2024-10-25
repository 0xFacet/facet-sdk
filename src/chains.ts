import { Chain } from "viem";

// Facet Sepolia Testnet Configuration
export const facetSepolia = {
  id: 0xface7a,
  name: "Facet Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Facet Compute Token",
    symbol: "FCT",
  },
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
  testnet: true,
} as const satisfies Chain;

// Facet Mainnet Configuration
export const facetMainnet = {
  id: 0xface7,
  name: "Facet",
  nativeCurrency: {
    decimals: 18,
    name: "Facet Compute Token",
    symbol: "FCT",
  },
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
} as const satisfies Chain;
