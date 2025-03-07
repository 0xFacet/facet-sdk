# @0xfacet/sdk

The `@0xfacet/sdk` is a TypeScript SDK designed for interacting with the Facet network, a decentralized rollup on Ethereum. This SDK simplifies sending transactions, reading from contracts, and handling Facet's unique transaction model.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [Hooks (`hooks`)](#hooks-hooks)
  - [Utilities (`utils`)](#utilities-utils)
  - [Viem (`viem`)](#viem-viem)
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

Import and initialize the SDK functions as needed:

```typescript
import React from "react";
import { useFacet, facetMainnet } from "@0xfacet/sdk";

function BalanceChecker() {
  const { writeFacetContract } = useFacet();

  // Simple read example
  const checkBalance = async () => {
    try {
      // For read operations, you'd typically use a viem publicClient
      const publicClient = createPublicClient({
        chain: facetMainnet,
        transport: http()
      });

      const balance = await publicClient.readContract({
        address: "0xContractAddress",
        abi: [...],
        functionName: "getBalance",
        args: ["0xUserAddress"]
      });

      console.log("Balance:", balance);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Simple write example
  const updateValue = async () => {
    try {
      const receipt = await writeFacetContract({
        address: "0xContractAddress",
        functionAbi: {
          name: "setValue",
          type: "function",
          inputs: [{ name: "newValue", type: "uint256" }],
          outputs: [],
          stateMutability: "nonpayable"
        },
        args: [123]
      });

      console.log("Success:", receipt);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <button onClick={checkBalance}>Check Balance</button>
      <button onClick={updateValue}>Update Value</button>
    </div>
  );
}

export default BalanceChecker;
```

## API Reference

### Hooks (`hooks`)

#### `useFacet(config?: FacetHookConfig)`

A React hook for interacting with the Facet network.

**Parameters:**

- `config` (optional): Configuration object with the following properties:
  - `contractAddresses`: Custom contract addresses to use instead of the default ones
  - `onTransaction`: Callback function that receives transaction status updates

**Returns:**

- `sendFacetTransaction`: Sends a transaction to the Facet network
- `sendBridgeAndCallTransaction`: Bridges ETH from L1 to L2 and executes a call on L2
- `sendFacetBuddyTransaction`: Sends a transaction through the Buddy Factory contract
- `writeFacetContract`: Executes a write function on a contract on the Facet network

#### `sendFacetTransaction(transaction: FacetTransactionParams)`

Sends a transaction to the Facet network.

**Parameters:**

- `transaction`: Object containing:
  - `to`: Contract address to call
  - `data`: Encoded function data

**Returns:**

- Promise that resolves to transaction receipt

#### `sendBridgeAndCallTransaction(transaction: FacetTransactionParams, ethValue: bigint)`

Bridges ETH from L1 to L2 and executes a call on L2.

**Parameters:**

- `transaction`: Object containing transaction parameters
- `ethValue`: Amount of ETH to bridge (in wei)

**Returns:**

- Promise that resolves to transaction receipt

#### `sendFacetBuddyTransaction(transaction: FacetTransactionParams, ethValue: bigint)`

Sends a transaction through the Buddy Factory contract.

**Parameters:**

- `transaction`: Object containing transaction parameters
- `ethValue`: Amount of ETH to use in the transaction

**Returns:**

- Promise that resolves to transaction receipt

#### `writeFacetContract({ address, functionAbi, args, ethValue }: WriteParams)`

Executes a write function on a contract on the Facet network.

**Parameters:**

- `address`: Contract address
- `functionAbi`: ABI of the function to call
- `args`: Arguments to pass to the function (optional)
- `ethValue`: ETH value to send with the transaction (optional)

**Returns:**

- Promise that resolves to transaction receipt

### Utilities (`utils`)

#### `buildFacetTransaction`

```typescript
buildFacetTransaction(
  l1ChainId: number,
  account: Address,
  params: FacetTransactionParams,
  sendL1Transaction: (l1Transaction: L1Transaction) => Promise<Hex>
)
```

Formats the L1 transaction that creates the Facet transaction. This function prepares the necessary data so that developers can then send the transaction using a library like viem.

#### `calculateInputGasCost`

```typescript
calculateInputGasCost(input: Uint8Array): bigint
```

Computes the gas cost of input data according to EVM rules.

#### `computeFacetTransactionHash`

```typescript
computeFacetTransactionHash(
  l1TransactionHash: Hex,
  from: Address,
  to: Address,
  value: bigint,
  data: Hex,
  gasLimit: bigint,
  mint: bigint
): Hex
```

Computes a hash for a Facet transaction.

#### `decodeFacetEncodedTransaction`

```typescript
decodeFacetEncodedTransaction(encodedData: Hex)
```

Decodes an encoded Facet transaction from an L1 transaction to the Facet Inbox.

#### `getFacetTransactionHashFromL1Hash`

```typescript
getFacetTransactionHashFromL1Hash(l1TransactionHash: Hex, l1ChainId: number): Promise<Hex>
```

Retrieves the Facet transaction hash associated with a given L1 transaction hash.

#### `getFctMintRate`

```typescript
getFctMintRate(l1ChainId: 1 | 11155111): Promise<bigint>
```

Retrieves the current FCT mint rate from the L1 block contract.

#### `applyL1ToL2Alias`

```typescript
applyL1ToL2Alias(l1Address: Address): Address
```

Converts an L1 contract address into corresponding L2 address.

#### `undoL1ToL2Alias`

```typescript
undoL1ToL2Alias(l2Address: Address): Address
```

Converts an L2 address (as seen in `msg.sender`) back to its original L1 contract address.

### Viem (`viem`)

#### `walletL1FacetActions`

```typescript
walletL1FacetActions(l1WalletClient: WalletClient)
```

Creates a set of L1 Facet transaction actions bound to the provided wallet client.

### Contributing

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Submit a pull request.

### License

This project is licensed under the MIT License.
