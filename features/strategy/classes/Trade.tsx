import { StockValue } from "./StockValue";

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
}