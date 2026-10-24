import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { CreditHistoryData, CreditHistoryPage } from "./CreditEntry";

export const CreditService = {
    /** One page of the signed-in user's credit history, newest first. Pass `before` to get the next page. */
    async fetchHistory(accessToken: string, before: number | null = null, limit: number = 50): Promise<CreditHistoryPage> {
        const query = new URLSearchParams({ limit: String(limit) });
        if (before !== null) {
            query.set("before", String(before));
        }
        const response = await networkRequest(
            `${URL_EXT.CREDIT_HISTORY}?${query.toString()}`,
            RequestMethod.GET,
            { ...HEADERS(accessToken).AUTH }
        );
        return CreditHistoryPage.fromData(response.data as CreditHistoryData);
    },
};
