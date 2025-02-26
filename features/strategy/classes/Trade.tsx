import { StockValue, StockValueData } from "./StockValue";

export interface TradeData {
    stock_value: StockValueData;
    is_buy: boolean;
}

export class Trade {
    stockValue: StockValue;
    isBuy: boolean;

    constructor(
        stockValue: StockValue,
        isBuy: boolean
    ) {
        this.stockValue = stockValue;
        this.isBuy = isBuy;
    }

    toNavigationJSON(): string {
        return JSON.stringify({
            stockValue: this.stockValue.toNavigationJSON(),
            isBuy: this.isBuy
        });
    }
    
    static fromNavigationJSON(jsonString: string): Trade {
        const data = JSON.parse(jsonString);
        return new Trade(
            StockValue.fromNavigationJSON(data.stockValue),
            data.isBuy
        );
    }

    static fromData(data: TradeData): Trade {
        return new Trade(
            StockValue.fromData(data.stock_value),
            data.is_buy
        )
    }
}