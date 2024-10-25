import { WalletClient } from "viem";

import { FacetTransactionParams } from "@/types";
import { sendFacetTransaction } from "@/utils/sendFacetTransaction";

export const facetExtensions = (l1WalletClient: WalletClient) => ({
  sendFacetTransaction: (params: FacetTransactionParams) =>
    sendFacetTransaction(l1WalletClient, params),
});
