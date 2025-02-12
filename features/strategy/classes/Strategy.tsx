import { CandleLength } from "../enums/CandleLength";
import { Signal, SignalData } from "./Signal";
import { Trade, TradeData } from "./Trade";

export interface StrategyData {
    id: number;
    symbol: string;
    candle_length: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    initial_investment: number;
    trades: TradeData[];
    estimated_return: number;
}

export class Strategy {
    id: number;
    symbol: string;
    candleLength: CandleLength;
    buySignals: Signal[];
    sellSignals: Signal[];
    initialInvestment: number;
    trades: Trade[];
    estimatedReturn: number;
    
    constructor(
        id: number,
        symbol: string,
        candleLength: CandleLength,
        buySignals: Signal[],
        sellSignals: Signal[],
        initialInvestment: number,
        trades: Trade[],
        estimatedReturn: number
    ) {
        this.id = id;
        this.symbol = symbol;
        this.candleLength = candleLength;
        this.buySignals = buySignals;
        this.sellSignals = sellSignals;
        this.initialInvestment = initialInvestment;
        this.trades = trades;
        this.estimatedReturn = estimatedReturn;
    }

    static fromData(data: StrategyData): Strategy {
        const candleLength = Object.values(CandleLength).includes(data.candle_length as CandleLength)
                    ? (data.candle_length as CandleLength)
                    : (() => {
                        throw new Error(`Invalid candle length value: ${data.candle_length}`);
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
            candleLength,
            buySignals,
            sellSignals,
            data.initial_investment,
            trades,
            data.estimated_return
        )
    }
}