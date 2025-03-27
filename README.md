# @0xfacet/sdk

The `@0xfacet/sdk` is a TypeScript SDK designed for interacting with the Facet network, a decentralized rollup on Ethereum. This SDK simplifies sending transactions, reading from contracts, and handling Facet's unique transaction model, with full compatibility with viem and wagmi.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [Viem Integration](#viem-integration)
  - [WAGMI Integration](#wagmi-integration)
  - [Utility Functions](#utility-functions)
- [Examples](#examples)
  - [Using Viem Methods](#using-viem-methods)
  - [Using WAGMI Hooks](#using-wagmi-hooks)
  - [Using Standard Methods](#using-standard-methods)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install the package via npm or yarn:

```sh
npm install @0xfacet/sdk
```

```sh
yarn add @0xfacet/sdk
```

## Getting Started

Import and use the SDK functions as needed:

```typescript
// For viem users
import {
  sendFacetTransaction,
  writeFacetContract,
  bridgeAndCall,
  facetMainnet,
} from "@0xfacet/sdk/viem";
import { createWalletClient, http } from "viem";

// For wagmi users
import {
  useSendFacetTransaction,
  useWriteFacetContract,
  useBridgeAndCall,
} from "@0xfacet/sdk/wagmi";

// For utility functions
import {
  getFctMintRate,
  decodeFacetEncodedTransaction,
  computeFacetTransactionHash,
  sendRawFacetTransaction,
} from "@0xfacet/sdk/utils";
```

## API Reference

### Viem Integration

#### `sendFacetTransaction`

Sends a transaction through the Facet protocol.

```typescript
function sendFacetTransaction<chain, account, request, chainOverride>(
  client: Client<Transport, chain, account>,
  parameters: SendTransactionParameters<
    chain,
    account,
    chainOverride,
    request
  > & {
    mineBoost?: Hex; // Optional boost to increase FCT mining amount
  }
): Promise<SendTransactionReturnType>;
```

#### `writeFacetContract`

Executes a write operation on a contract through the Facet infrastructure.

```typescript
function writeFacetContract<
  chain,
  account,
  abi,
  functionName,
  args,
  chainOverride,
>(
  client: Client<Transport, chain, account>,
  parameters: WriteContractParameters<
    abi,
    functionName,
    args,
    chain,
    account,
    chainOverride
  > & {
    mineBoost?: Hex; // Optional boost to increase FCT mining amount
  }
): Promise<WriteContractReturnType>;
```

#### `bridgeAndCall`

Bridges ETH from L1 to L2 and executes a contract call in a single transaction.

```typescript
function bridgeAndCall<chain, account, abi, functionName, args, chainOverride>(
  client: Client<Transport, chain, account>,
  parameters: WriteContractParameters<
    abi,
    functionName,
    args,
    chain,
    account,
    chainOverride
  >,
  ethValue: bigint,
  bridgeAndCallConfig?: BridgeAndCallConfig
): Promise<WriteContractReturnType>;
```

### WAGMI Integration

#### `useSendFacetTransaction`

React hook for sending Facet transactions.

```typescript
function useSendFacetTransaction<config, context>(
  parameters?: UseSendFacetTransactionParameters<config, context>
): UseSendFacetTransactionReturnType<config, context>;
```

The transaction parameters can include the optional `mineBoost` property to increase the amount of FCT mined by the transaction.

#### `useWriteFacetContract`

React hook for executing write operations on contracts through Facet.

```typescript
function useWriteFacetContract<abi, functionName, args, config, context>(
  parameters?: UseWriteFacetContractParameters<
    abi,
    functionName,
    args,
    config,
    context
  >
): UseWriteFacetContractReturnType<abi, functionName, args, config, context>;
```

The contract write parameters can include the optional `mineBoost` property to increase the amount of FCT mined by the transaction.

#### `useBridgeAndCall`

React hook for bridging ETH from L1 to L2 and executing a call on L2.

```typescript
function useBridgeAndCall<config, context>(
  parameters?: UseBridgeAndCallParameters<config, context>
): UseBridgeAndCallReturnType<config, context>;
```

### Utility Functions

#### `getFctMintRate`

Retrieves the current FCT mint rate from the L1 block contract.

```typescript
function getFctMintRate(l1ChainId: 1 | 11155111): Promise<bigint>;
```

#### `computeFacetTransactionHash`

Computes a hash for a Facet transaction.

```typescript
function computeFacetTransactionHash(
  l1TransactionHash: Hex,
  from: Address,
  to: Address,
  value: bigint,
  data: Hex,
  gasLimit: bigint,
  mint: bigint
): Hex;
```

## Examples

### Using Viem Methods

#### Send a Facet Transaction

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { sendFacetTransaction } from "@0xfacet/sdk/viem";

const account = privateKeyToAccount("0xYourPrivateKey");
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

// Send a basic transaction
const hash = await sendFacetTransaction(client, {
  to: "0xRecipientAddress",
  value: 1000000000000000000n, // 1 FCT
  data: "0x", // Empty data for simple FCT transfer
  mineBoost: "0x01", // Optional: increase FCT mining amount
});

console.log("Transaction hash:", hash);
```

#### Write to a Contract

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { writeFacetContract } from "@0xfacet/sdk/viem";

const account = privateKeyToAccount("0xYourPrivateKey");
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

// ERC-20 token transfer example
const hash = await writeFacetContract(client, {
  address: "0xTokenContractAddress",
  abi: [
    {
      name: "transfer",
      type: "function",
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
    },
  ],
  functionName: "transfer",
  args: ["0xRecipientAddress", 1000000000000000000n], // 1 token with 18 decimals
  mineBoost: "0x02", // Optional: increase FCT mining amount
});

console.log("Contract transaction hash:", hash);
```

#### Bridge ETH and Call a Contract

```typescript
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { bridgeAndCall } from "@0xfacet/sdk/viem";

const account = privateKeyToAccount("0xYourPrivateKey");
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

// Bridge ETH and call a contract function
const hash = await bridgeAndCall(
  client,
  {
    address: "0xL2ContractAddress",
    abi: [
      {
        name: "purchaseWithBridgedETH",
        type: "function",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
        stateMutability: "payable",
      },
    ],
    functionName: "purchaseWithBridgedETH",
    args: [123],
  },
  parseEther("0.1"), // ETH value to bridge
  {
    // Optional config
    maxFeePerGas: 20000000000n,
    maxPriorityFeePerGas: 2000000000n,
  }
);

console.log("Bridge and call transaction hash:", hash);
```

### Using WAGMI Hooks

#### Send a Facet Transaction with WAGMI

```tsx
import React from "react";
import { parseEther } from "viem";
import { useSendFacetTransaction } from "@0xfacet/sdk/wagmi";

function SendTransaction() {
  const { sendFacetTransactionAsync, data } = useSendFacetTransaction();

  const handleSend = async () => {
    try {
      // Using the async version
      const hash = await sendFacetTransactionAsync({
        to: "0xRecipientAddress",
        value: parseEther("0.01"),
        mineBoost: "0x01", // Optional: increase FCT mining amount
      });

      console.log("Transaction submitted:", hash);
    } catch (error) {
      console.error("Failed to send transaction:", error);
    }
  };

  return <button onClick={handleSend}>Send 0.01 FCT</button>;
}
```

#### Contract Write with WAGMI

```tsx
import React from "react";
import { useWriteFacetContract } from "@0xfacet/sdk/wagmi";

const abi = [
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

function MintNFT() {
  const { writeFacetContractAsync } = useWriteFacetContract({
    abi,
    address: "0xNFTContractAddress",
    functionName: "mint",
  });

  const handleMint = async () => {
    try {
      await writeFacetContractAsync({
        args: ["0xYourAddress", 123n],
        mineBoost: "0x01", // Optional: increase FCT mining amount
      });
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  return <button onClick={handleMint}>Mint NFT</button>;
}
```

#### Bridge ETH and Call Contract

```tsx
import React from "react";
import { parseEther } from "viem";
import { useBridgeAndCall } from "@0xfacet/sdk/wagmi";

function BridgeAndMint() {
  const { bridgeAndCall } = useBridgeAndCall();

  const handleBridgeAndMint = () => {
    bridgeAndCall({
      address: "0xL2ContractAddress",
      abi: [
        {
          name: "mintWithBridgedETH",
          type: "function",
          inputs: [{ name: "tokenId", type: "uint256" }],
          outputs: [],
          stateMutability: "payable",
        },
      ],
      functionName: "mintWithBridgedETH",
      args: [123],
      ethValue: parseEther("0.1"), // Amount of ETH to bridge from L1 to L2
    });
  };

  return <button onClick={handleBridgeAndMint}>Bridge & Mint</button>;
}
```

### Using Standard Methods

The SDK is fully compatible with standard viem and wagmi methods. Here are some examples:

#### Read Contract with viem

```typescript
import { createPublicClient, http } from "viem";
import { facetMainnet } from "@0xfacet/sdk/viem";

const publicClient = createPublicClient({
  chain: facetMainnet,
  transport: http(),
});

// Standard viem readContract works normally
const balance = await publicClient.readContract({
  address: "0xTokenContract",
  abi: [
    {
      name: "balanceOf",
      type: "function",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
  ],
  functionName: "balanceOf",
  args: ["0xUserAddress"],
});

console.log("Balance:", balance);
```

#### Using wagmi's useReadContract

```tsx
import React from "react";
import { useReadContract } from "wagmi";

function TokenBalance() {
  const { data: balance } = useReadContract({
    address: "0xTokenContract",
    abi: [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
      },
    ],
    functionName: "balanceOf",
    args: ["0xUserAddress"],
  });

  return <div>Balance: {balance?.toString() || "Loading..."}</div>;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.
