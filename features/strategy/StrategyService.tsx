import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { Backtest, BacktestResponseDataFormat } from "./classes/Backtest";
import { Strategy, StrategyData } from "./classes/Strategy";
import { SymbolsAndIntervalsResponseData, SymbolsAndIntervalsResponseDTO } from "./dtos/SymbolsAndIntervalsResponseDTO";

export interface ReturnedBacktest {
    backtest: Backtest,
    userAccountCredits: number,
    userMonthlyCredits: number
}

export const StrategyService = {
    async conductBacktest(backtest: Backtest, token: string): Promise<ReturnedBacktest> {
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
            const returnedBacktest: ReturnedBacktest = {
                backtest: updatedBacktest,
                userAccountCredits: data.user_account_credits,
                userMonthlyCredits: data.user_monthly_credits
            }
            return returnedBacktest;
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

    /** Changes a strategy's title, signals or exit rules (`body` is built by buildEditBody). Returns the strategy as it is now. */
    async updateStrategy(id: number, body: string, token: string): Promise<Strategy> {
        const response = await networkRequest(
            URL_EXT.STRATEGY + `${id}/`,
            RequestMethod.PATCH,
            { ...HEADERS().JSON, ...HEADERS(token).AUTH },
            body
        );
        return Strategy.fromData(response.data as StrategyData);
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
    },

    async getSymbolsAndIntervals(token: string): Promise<SymbolsAndIntervalsResponseDTO> {
        const headers = {
            ...HEADERS(token).AUTH
        }
        const urlExt = URL_EXT.SYMBOLS_AND_INTERVALS;
        try {
            const response = await networkRequest(
                urlExt,
                RequestMethod.POST,
                headers,
            );
            const data = response.data as SymbolsAndIntervalsResponseData;
            const processedData = SymbolsAndIntervalsResponseDTO.fromData(data);
            return processedData;
        } catch (error) {
            throw(error);
        }
    }
}
