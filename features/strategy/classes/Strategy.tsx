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
}

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
        chargeUserDate: Date = new Date()
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
            new Date(data.charge_user_date)
        )
    }
}