import { Address, Hex, TransactionReceipt } from "viem";

export interface FacetTransactionParams {
  data?: Hex | undefined;
  to?: Address | null | undefined;
  value?: bigint | undefined;
  mineBoost?: Hex | undefined;
}

export type FacetTransactionStatus =
  | { status: "pending"; hash: string; explorerUrl?: string }
  | {
      status: "success";
      hash: string;
      explorerUrl?: string;
      receipt: TransactionReceipt;
    }
  | { status: "error"; hash: string; explorerUrl?: string; error: Error };

export interface L1Transaction {
  account: Address;
  to: "0x00000000000000000000000000000000000FacE7";
  value: bigint;
  data: Hex;
  gas: bigint;
  chainId: number;
}

export interface DepositTx {
  sourceHash: Hex;
  from: Address;
  to: Address;
  mint: bigint;
  value: bigint;
  gasLimit: bigint;
  data: Hex;
}
