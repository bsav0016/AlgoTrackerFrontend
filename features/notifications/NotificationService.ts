import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { NotificationHistoryData, NotificationHistoryPage } from "./NotificationEntry";

export const NotificationService = {
    /** One page of the signed-in user's signal notifications, newest first. Pass `before` for the next page. */
    async fetchHistory(accessToken: string, before: number | null = null, limit: number = 50): Promise<NotificationHistoryPage> {
        const query = new URLSearchParams({ limit: String(limit) });
        if (before !== null) {
            query.set("before", String(before));
        }
        const response = await networkRequest(
            `${URL_EXT.NOTIFICATIONS}?${query.toString()}`,
            RequestMethod.GET,
            { ...HEADERS(accessToken).AUTH }
        );
        return NotificationHistoryPage.fromData(response.data as NotificationHistoryData);
    },
};
