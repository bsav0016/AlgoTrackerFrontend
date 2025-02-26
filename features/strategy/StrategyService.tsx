import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { Backtest, BacktestResponseDataFormat } from "./classes/Backtest";
import { Strategy } from "./classes/Strategy";


export const StrategyService = {
    async conductBacktest(backtest: Backtest, token: string): Promise<Backtest> {
        const body = backtest.toRequestJSON();
        const headers = {
            ...HEADERS().JSON,
            ...HEADERS(token).AUTH
        }
        const urlExt = URL_EXT.BACKTEST
        try {
            const response = await networkRequest(
                urlExt,
                RequestMethod.POST,
                headers,
                body
            );
            const data = response.data as BacktestResponseDataFormat;
            const updatedBacktest = backtest.updateFromData(data);
            return updatedBacktest;
        } catch (error) {
            throw(error);
        }
    },

    async subscribeStrategy(strategy: Strategy, token: string): Promise<boolean> {
        const body = strategy.toSubscribeJSON();
        const headers = {
            ...HEADERS().JSON,
            ...HEADERS(token).AUTH
        }
        const urlExt = URL_EXT.STRATEGY;
        try {
            await networkRequest(
                urlExt,
                RequestMethod.POST,
                headers,
                body
            );
            return true;
        } catch (error) {
            throw(error);
        }
    },

    async unsubscribeStrategy(strategy: Strategy, token: string): Promise<boolean> {
        const headers = {
            ...HEADERS(token).AUTH
        }
        const urlExt = URL_EXT.STRATEGY + `${strategy.id}/`;
        try {
            await networkRequest(
                urlExt,
                RequestMethod.DELETE,
                headers,
            );
            return true;
        } catch (error) {
            throw(error);
        }
    }
}
