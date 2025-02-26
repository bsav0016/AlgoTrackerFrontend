import { Interval } from "../enums/Interval";
import { Signal, SignalData } from "./Signal";
import { Trade, TradeData } from "./Trade";

export interface StrategyData {
    id: number;
    symbol: string;
    interval: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    trades: TradeData[];
    estimated_return: number;
}

export class Strategy {
    id: number;
    symbol: string;
    interval: Interval;
    buySignals: Signal[];
    sellSignals: Signal[];
    trades: Trade[];
    estimatedReturn: number;
    
    constructor(
        id: number,
        symbol: string,
        interval: Interval,
        buySignals: Signal[],
        sellSignals: Signal[],
        trades: Trade[],
        estimatedReturn: number
    ) {
        this.id = id;
        this.symbol = symbol;
        this.interval = interval;
        this.buySignals = buySignals;
        this.sellSignals = sellSignals;
        this.trades = trades;
        this.estimatedReturn = estimatedReturn;
    }

    toNavigationJSON(): string {
        return JSON.stringify({
            id: this.id,
            symbol: this.symbol,
            interval: this.interval,
            buySignals: this.buySignals.map((signal) => signal.toNavigationJSON()),
            sellSignals: this.sellSignals.map((signal) => signal.toNavigationJSON()),
            trades: this.trades.map((trade) => trade.toNavigationJSON()),
            estimatedReturn: this.estimatedReturn,
        });
    }

    static fromNavigationJSON(jsonString: string): Strategy {
        const data = JSON.parse(jsonString);
        return new Strategy(
            data.id,
            data.symbol,
            data.interval as Interval,
            data.buySignals.map((signalData: string) => Signal.fromNavigationJSON(signalData)),
            data.sellSignals.map((signalData: string) => Signal.fromNavigationJSON(signalData)),
            data.trades.map((tradeData: string) => Trade.fromNavigationJSON(tradeData)),
            data.estimatedReturn
        );
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
            interval: this.interval,
            signals: signals
        })
    }

    static fromData(data: StrategyData): Strategy {
        const interval = Object.values(Interval).includes(data.interval as Interval)
                    ? (data.interval as Interval)
                    : (() => {
                        throw new Error(`Invalid interval value: ${data.interval}`);
                    })();
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
            data.symbol,
            interval,
            buySignals,
            sellSignals,
            trades,
            data.estimated_return
        )
    }
}