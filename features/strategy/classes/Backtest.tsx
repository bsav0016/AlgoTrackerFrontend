import { IndicatorValue } from "./IndicatorValue";
import { StockValue } from "./StockValue";
import { Strategy } from "./Strategy";

export class Backtest {
    strategy: Strategy;
    startDate: Date;
    endDate: Date;
    stockValues: StockValue[];
    indicatorValues: IndicatorValue[];

    constructor(
        strategy: Strategy,
        startDate: Date,
        endDate: Date,
        stockValues: StockValue[],
        indicatorValues: IndicatorValue[]
    ) {
        this.strategy = strategy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.stockValues = stockValues;
        this.indicatorValues = indicatorValues;
    }
}