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
import { useFacet } from "@0xfacet/sdk";

const { sendFacetMethodWrite, sendFacetMethodRead } = useFacet();

async function interactWithContract() {
  const result = await sendFacetMethodRead({
    to: "0xContractAddress",
    functionAbi: {
      name: "getBalance",
      type: "function",
      inputs: [{ name: "address", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
      stateMutability: "view",
    },
    args: ["0xUserAddress"],
  });

  console.log("Balance:", result);
}
```

## API Reference

### Hooks (`hooks`)

#### `useFacet(config?: FacetConfig): FacetResult`

A React hook for interacting with the Facet network.

**Returns:**

- `sendFacetMethodWrite`: Executes a write operation on Facet.
- `sendFacetMethodRead`: Reads data from a contract on Facet.
- `simulateFacetMethodWrite`: Simulates a contract call.
- `sendRawFacetTransaction`: Sends a raw transaction to Facet.

### Utilities (`utils`)

#### `createFacetTransaction`

```typescript
createFacetTransaction(
  l1ChainId: number,
  account: Address,
  params: FacetTransactionParams,
  sendL1Transaction: (l1Transaction: L1Transaction) => Promise<Hex>
)
```

Formats the L1 transaction that creates the Facet transaction. This function prepares the necessary data so that developers can then send the transaction using a library like viem.

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

### Viem (`viem`)

#### `createFacetPublicClient`

```typescript
createFacetPublicClient(l1ChainId: 1 | 11155111, transport?: HttpTransport): FacetPublicClient
```

Creates a public client configured for the Facet network.

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
