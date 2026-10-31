import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { Strategy, StrategyData } from "@/features/strategy/classes/Strategy";
import { SharedStrategy, SharedStrategyData, sharedStrategyFromData } from "./SharedStrategy";

export const ShareService = {
    /** Turns on the public link for one of the user's strategies and returns its id. Asking again returns the same id. */
    async createShare(strategyId: number, token: string): Promise<string> {
        const response = await networkRequest(
            `${URL_EXT.STRATEGY}${strategyId}/share/`,
            RequestMethod.POST,
            HEADERS(token).AUTH,
        );
        return response.data.share_id as string;
    },

    /** Turns the link off for good. Harmless if the strategy was not shared. */
    async revokeShare(strategyId: number, token: string): Promise<void> {
        await networkRequest(
            `${URL_EXT.STRATEGY}${strategyId}/share/`,
            RequestMethod.DELETE,
            HEADERS(token).AUTH,
        );
    },

    /** Reads a shared strategy. Needs no sign-in. */
    async getShared(shareId: string): Promise<SharedStrategy> {
        const response = await networkRequest(`${URL_EXT.SHARED}${shareId}/`, RequestMethod.GET);
        return sharedStrategyFromData(response.data as SharedStrategyData);
    },

    /** Copies a shared strategy into the user's account as an inactive draft. Costs nothing. */
    async cloneShared(shareId: string, token: string): Promise<Strategy> {
        const response = await networkRequest(
            `${URL_EXT.SHARED}${shareId}/clone/`,
            RequestMethod.POST,
            HEADERS(token).AUTH,
        );
        return Strategy.fromData(response.data as StrategyData);
    },

    /** Starts tracking a draft. The first monthly charge is 30 days away, as for any new strategy. */
    async activate(strategyId: number, token: string): Promise<Strategy> {
        const response = await networkRequest(
            `${URL_EXT.STRATEGY}${strategyId}/activate/`,
            RequestMethod.POST,
            HEADERS(token).AUTH,
        );
        return Strategy.fromData(response.data as StrategyData);
    },
};
