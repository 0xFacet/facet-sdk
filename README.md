# Facet SDK

The Facet SDK is a powerful and versatile library designed to facilitate interaction with the Facet network, leveraging Viem for blockchain interactions. It offers React hooks, types, utility functions, and seamless Viem integrations to streamline development on the Facet network.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Hooks](#hooks)
  - [Utils](#utils)
  - [Viem Integration](#viem-integration)
- [Examples](#examples)
  - [Example 1: Sending a Facet Transaction in a React Component](#example-1-sending-a-facet-transaction-in-a-react-component)
  - [Example 2: Executing a Facet Transaction with Viem Wallet Client](#example-2-executing-a-facet-transaction-with-viem-wallet-client)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the Facet SDK, use npm or yarn:

```bash
npm install @0xfacet/sdk
```

or

```bash
yarn add @0xfacet/sdk
```

## Getting Started

### Hooks

The Facet SDK provides React hooks to interact with the Facet network seamlessly.

```tsx
import { useFacet } from "@0xfacet/sdk";

const { sendFacetMethodWrite, sendFacetMethodRead } = useFacet();

sendFacetMethodWrite({ to: "0x...", functionAbi: abiFunction, args: [] });
```

### Utils

The SDK offers utility functions for transaction preparation, encoding, and hash computation.

```ts
import {
  computeFacetTransactionHash,
  prepareFacetTransaction,
} from "@0xfacet/sdk";

const hash = computeFacetTransactionHash(
  l1TransactionHash,
  from,
  to,
  value,
  data,
  gasLimit,
  mint
);
```

### Viem Integration

Integrate with the Viem client to interact with the Facet blockchain seamlessly.

```ts
import { createFacetPublicClient } from "@0xfacet/sdk";

const client = createFacetPublicClient(1); // 1 for Ethereum mainnet
```

## Examples

### Example 1: Sending a Facet Transaction in a React Component

```tsx
import { useFacet } from "@0xfacet/sdk";
import React, { useState } from "react";

const FacetTransactionComponent: React.FC = () => {
  const { sendFacetMethodWrite } = useFacet();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSendTransaction = async () => {
    try {
      const transactionReceipt = await sendFacetMethodWrite({
        to: "0xRecipientAddress",
        functionAbi: {
          name: "transfer",
          type: "function",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        args: [],
      });
      if (transactionReceipt) {
        setTransactionHash(transactionReceipt.transactionHash);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <div>
      <button onClick={handleSendTransaction}>Send Facet Transaction</button>
      {transactionHash && <p>Transaction Hash: {transactionHash}</p>}
    </div>
  );
};

export default FacetTransactionComponent;
```

### Example 2: Executing a Facet Transaction with Viem Wallet Client

```ts
import { createFacetTransaction } from "@0xfacet/sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

async function executeFacetTransaction() {
  const account = privateKeyToAccount("0x…");
  const transaction = await createFacetTransaction(
    1,
    account.address,
    { to: "0x…", value: 1n },
    async (tx) => {
      const walletClient = createWalletClient({
        account: privateKeyToAccount("0x…"),
        chain: mainnet,
        transport: http(),
      });
      const l1TransactionHash = await walletClient.sendTransaction(tx);
      return l1TransactionHash;
    }
  );

  console.log("Facet Transaction Hash:", transaction.facetTransactionHash);
}

executeFacetTransaction();
```

## Contributing

Contributions are welcome! Please fork the repository, create a new branch, and submit a pull request.

## License

[MIT License](LICENSE)
