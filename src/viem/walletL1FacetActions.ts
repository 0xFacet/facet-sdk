import { WalletClient } from "viem";

import { FacetTransactionParams } from "../types";
import { sendFacetTransaction } from "./sendFacetTransaction";

export const walletL1FacetActions = (l1WalletClient: WalletClient) => ({
  sendFacetTransaction: (params: FacetTransactionParams) =>
    sendFacetTransaction(l1WalletClient, params),
});
