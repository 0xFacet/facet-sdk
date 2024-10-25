# Facet SDK

**Facet SDK** is a TypeScript-based SDK that allows users to interact seamlessly with the Facet blockchain ecosystem, including functionalities like transaction creation, transaction tracking, and integration with `viem`.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [Configuration](#configuration)
  - [Examples](#examples)
- [Integrations](#integrations)
  - [Using with Wagmi](#using-with-wagmi)
  - [Using with RainbowKit](#using-with-rainbowkit)
- [Development](#development)
  - [Scripts](#scripts)
  - [Linting and Formatting](#linting-and-formatting)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install **Facet SDK** with npm:

```bash
npm install @0xfacet/sdk
```

Or with yarn:

```bash
yarn add @0xfacet/sdk
```

## Usage

### Configuration

**Facet SDK** supports both **WalletClient** and **PublicClient** from `viem` for interacting with Facet transactions. Make sure you configure the correct client (L1 for Ethereum transactions, L2 for Facet transactions).

### Examples

#### 1. Basic Setup

Initialize the SDK by importing Facet chains and clients.

```typescript
import { facetExtensions } from "@0xfacet/sdk";
import { createWalletClient, http } from "viem";

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(),
}).extend(facetExtensions);
```

#### 2. Send a Facet Transaction

```typescript
const params = {
  account: { address: "0xYourAccountAddress" },
  to: "0xReceiverAddress",
  data: "0x", // Optional data
  value: 0n,
};

const l2TransactionHash = await walletClient.sendFacetTransaction(params);
console.log("L2 Transaction Hash:", l2TransactionHash);
```

## Development

### Scripts

- **Build**: Compiles TypeScript files to JavaScript for distribution.

  ```bash
  npm run build
  ```

- **Lint**: Lints TypeScript files for consistent code quality.

  ```bash
  npm run lint
  ```

- **Format**: Formats code with Prettier.

  ```bash
  npm run format
  ```

### Linting and Formatting

The SDK uses **ESLint** and **Prettier** for code quality and formatting. Run the following commands for linting and formatting:

```bash
npm run lint       # Check for lint errors
npm run lint:fix   # Auto-fix lint errors
npm run format     # Format code with Prettier
```

## Contributing

Contributions are welcome! Please follow the code style guidelines, linting, and formatting rules before submitting a pull request. For major changes, please open an issue first.

## License

[MIT License](LICENSE)

---

This README provides a comprehensive guide for users and developers interacting with **Facet SDK**. Let me know if there are specific details you’d like added or customized!
