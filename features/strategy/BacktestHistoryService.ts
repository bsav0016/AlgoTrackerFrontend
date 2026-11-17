import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { Backtest, SavedBacktestDetailData } from "./classes/Backtest";
import { SavedBacktestItem, SavedBacktestItemData, SavedBacktestPage, SavedBacktestPageData } from "./SavedBacktest";

/** Every limit on a label that the server enforces; the app stops typing there instead of failing on save. */
export const MAX_LABEL_LENGTH = 60;

export const BacktestHistoryService = {
    /** One page of the signed-in user's saved backtests, newest first. Pass `before` for the next page. */
    async list(accessToken: string, before: number | null = null, limit: number = 50): Promise<SavedBacktestPage> {
        const query = new URLSearchParams({ limit: String(limit) });
        if (before !== null) {
            query.set("before", String(before));
        }
        const response = await networkRequest(
            `${URL_EXT.BACKTESTS}?${query.toString()}`,
            RequestMethod.GET,
            { ...HEADERS(accessToken).AUTH }
        );
        return SavedBacktestPage.fromData(response.data as SavedBacktestPageData);
    },

    /** A saved run, ready for the results screen. Opening one is free: nothing is charged and no prices are fetched. */
    async open(accessToken: string, id: number): Promise<Backtest> {
        const response = await networkRequest(
            `${URL_EXT.BACKTESTS}${id}/`,
            RequestMethod.GET,
            { ...HEADERS(accessToken).AUTH }
        );
        return Backtest.fromSaved(response.data as SavedBacktestDetailData);
    },

    /** Gives a saved run a name (an empty one clears it). */
    async rename(accessToken: string, id: number, label: string): Promise<SavedBacktestItem> {
        const response = await networkRequest(
            `${URL_EXT.BACKTESTS}${id}/`,
            RequestMethod.PATCH,
            { ...HEADERS(accessToken).JSON, ...HEADERS(accessToken).AUTH },
            JSON.stringify({ label: label.trim() })
        );
        return SavedBacktestItem.fromData(response.data as SavedBacktestItemData);
    },

    async remove(accessToken: string, id: number): Promise<void> {
        await networkRequest(`${URL_EXT.BACKTESTS}${id}/`, RequestMethod.DELETE, { ...HEADERS(accessToken).AUTH });
    },
};
