# Facet SDK

**Facet SDK** is a TypeScript-based SDK that allows users to interact seamlessly with the Facet blockchain ecosystem, including functionalities like transaction creation and integration with `viem`.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Examples](#examples)
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

### Examples

#### 1. Basic Setup

Initialize the SDK by importing Facet chains and clients.

```typescript
import { walletL1FacetActions } from "@0xfacet/sdk/viem";
import { createWalletClient, http } from "viem";

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http(),
}).extend(FacetViem.walletL1FacetActions);
```

#### 2. Send a Facet Transaction

```typescript
const params = {
  to: "0xReceiverAddress", // Required
  data: "0x", // Optional
  value: 0n, // Optional
};

const { l1TransactionHash, facetTransactionHash } =
  await walletClient.sendFacetTransaction(params);
console.log("L1 Transaction Hash:", l1TransactionHash);
console.log("Facet Transaction Hash:", facetTransactionHash);
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
