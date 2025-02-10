import { CandleLength } from "../enums/CandleLength";
import { Signal } from "./Signal";
import { Trade } from "./Trade";

export class Strategy {
    symbol: string;
    candleLength: CandleLength;
    buySignals: Signal[];
    sellSignals: Signal[];
    initialInvestment: number;
    trades: Trade[];
    estimatedReturn: number;
    
    constructor(
        symbol: string,
        candleLength: CandleLength,
        buySignals: Signal[],
        sellSignals: Signal[],
        initialInvestment: number,
        trades: Trade[],
        estimatedReturn: number
    ) {
        this.symbol = symbol;
        this.candleLength = candleLength;
        this.buySignals = buySignals;
        this.sellSignals = sellSignals;
        this.initialInvestment = initialInvestment;
        this.trades = trades;
        this.estimatedReturn = estimatedReturn;
    }
}