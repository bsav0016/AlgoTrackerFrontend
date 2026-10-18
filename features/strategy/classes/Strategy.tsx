import { Signal, SignalData } from "./Signal";
import { Trade, TradeData } from "./Trade";

export interface StrategyData {
    id: number;
    title: string;
    symbol: string;
    interval: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    trades: TradeData[];
    strategy_return: number;
    asset_return: number;
    position: number;
    charge_user_date: string;
    active: boolean;
    // Open time (Unix seconds) of the newest candle the server has checked; null until the first one. Older servers do not send it.
    last_processed_ts?: number | null;
}

// A strategy that has not been charged yet is next charged a subscription period from now: exactly 30 x 24 hours, as
// the backend computes it (timedelta(days=30)), not 30 local calendar days, which is an hour off across a daylight
// saving change. A date that comes from the server is already the next charge date and is used as it is.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const thirtyDaysFromNow = () => new Date(Date.now() + THIRTY_DAYS_MS);

export const PositionMapping: Record<number, string> = {
    0: "Sell",
    1: "Hold (Sold)",
    2: "Hold (Bought)",
    3: "Buy",
};

export class Strategy {
    id: number;
    title: string;
    symbol: string;
    interval: string;
    buySignals: Signal[];
    sellSignals: Signal[];
    trades: Trade[];
    strategyReturn: number;
    assetReturn: number;
    position: number;
    chargeUserDate: Date;
    active: boolean;
    lastProcessedAt: Date | null;
    
    constructor(
        id: number,
        title: string,
        symbol: string,
        interval: string,
        buySignals: Signal[],
        sellSignals: Signal[],
        trades: Trade[] = [],
        strategyReturn: number = 1,
        assetReturn: number = 1,
        position: number = 1,
        chargeUserDate: Date = thirtyDaysFromNow(),
        active: boolean = true,
        lastProcessedAt: Date | null = null
    ) {
        this.id = id;
        this.title = title;
        this.symbol = symbol;
        this.interval = interval;
        this.buySignals = buySignals;
        this.sellSignals = sellSignals;
        this.trades = trades;
        this.strategyReturn = strategyReturn;
        this.assetReturn = assetReturn;
        this.position = position;
        this.chargeUserDate = chargeUserDate;
        this.active = active;
        this.lastProcessedAt = lastProcessedAt;
    }

    toSubscribeJSON() {
        let signals = []
        for (let buySignal of this.buySignals) {
            signals.push(buySignal.toJSON(true));
        }
        for (let sellSignal of this.sellSignals) {
            signals.push(sellSignal.toJSON(false));
        }

        return JSON.stringify({
            symbol: this.symbol,
            title: this.title,
            interval: this.interval,
            signals: signals
        })
    }

    /**
     * Rebuilds a strategy from the copy kept in AsyncStorage (see UserProvider). JSON.stringify turned every Date
     * into a string, wrote the signals in the API's shape (Signal.toJSON) and the rest in camelCase, so the dates and
     * classes have to be put back before anything calls .getTime() or similar on them.
     */
    static fromStored(stored: any): Strategy {
        const buySignals: Signal[] = (stored.buySignals ?? []).map((signal: SignalData) => Signal.fromData(signal));
        const sellSignals: Signal[] = (stored.sellSignals ?? []).map((signal: SignalData) => Signal.fromData(signal));
        const trades: Trade[] = (stored.trades ?? []).map(
            (trade: { date: string; price: number; isBuy: boolean }) => new Trade(new Date(trade.date), trade.price, trade.isBuy)
        );

        return new Strategy(
            stored.id,
            stored.title,
            stored.symbol,
            stored.interval,
            buySignals,
            sellSignals,
            trades,
            stored.strategyReturn,
            stored.assetReturn,
            stored.position,
            new Date(stored.chargeUserDate),
            stored.active,
            stored.lastProcessedAt ? new Date(stored.lastProcessedAt) : null
        );
    }

    static fromData(data: StrategyData): Strategy {
        let buySignals: Signal[] = [];
        let sellSignals: Signal[] = [];
        let trades: Trade[] = [];

        for (const buySignalData of data.buy_signals) {
            const buySignal = Signal.fromData(buySignalData);
            buySignals.push(buySignal);
        }

        for (const sellSignalData of data.sell_signals) {
            const sellSignal = Signal.fromData(sellSignalData);
            sellSignals.push(sellSignal);
        }

        for (const tradeData of data.trades) {
            const trade = Trade.fromData(tradeData);
            trades.push(trade);
        }

        return new Strategy(
            data.id,
            data.title,
            data.symbol,
            data.interval,
            buySignals,
            sellSignals,
            trades,
            data.strategy_return,
            data.asset_return,
            data.position,
            new Date(data.charge_user_date),
            data.active,
            data.last_processed_ts != null ? new Date(data.last_processed_ts * 1000) : null
        )
    }
}