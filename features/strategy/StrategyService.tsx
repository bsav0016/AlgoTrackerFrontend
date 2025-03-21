import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { Backtest, BacktestResponseDataFormat } from "./classes/Backtest";
import { Strategy } from "./classes/Strategy";
import { SymbolsAndIntervalsResponseData, SymbolsAndIntervalsResponseDTO } from "./dtos/SymbolsAndIntervalsResponseDTO";
import { useUser } from "@/contexts/UserContext";


export const StrategyService = {
    async conductBacktest(backtest: Backtest, token: string): Promise<Backtest> {
        const { updateAccountFunds } = useUser();
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
            updateAccountFunds(data.user_account_funds, data.user_monthly_funds);
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
            return data;
        } catch (error) {
            throw(error);
        }
    }
}
