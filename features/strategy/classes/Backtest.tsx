import { IndicatorValue } from "./IndicatorValue";
import { ReturnValue } from "./ReturnValue";
import { StockValue } from "./StockValue";
import { Strategy } from "./Strategy";
import { Trade } from "./Trade";

export interface BacktestResponseDataFormat {
    result: BacktestResultDataFormat[];
    image: string;
    sharpe_ratio: number;
    sortino_ratio: number;
}

interface BacktestResultDataFormat {
    datetime: string;
    close: number;
    indicators?: { [key: string]: number };
    buy: boolean;
    sell: boolean;
    owned: number;
    return: number;
    resultImage: string;
    sharpeRatio: number;
    sortinoRatio: number;
}

export class Backtest {
    strategy: Strategy;
    startDate: Date;
    endDate: Date;
    stockValues: StockValue[];
    indicatorValues: Record<string, IndicatorValue[]>;
    returnValues: ReturnValue[];
    resultImage: string | null;
    sharpeRatio: number | null;
    sortinoRatio: number | null;

    constructor(
        strategy: Strategy,
        startDate: Date,
        endDate: Date,
        stockValues: StockValue[],
        indicatorValues: Record<string, IndicatorValue[]>,
        returnValues: ReturnValue[],
        resultImage: string | null,
        sharpeRatio: number | null,
        sortinoRatio: number | null
    ) {
        this.strategy = strategy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.stockValues = stockValues;
        this.indicatorValues = indicatorValues;
        this.returnValues = returnValues;
        this.resultImage = resultImage;
        this.sharpeRatio = sharpeRatio;
        this.sortinoRatio = sortinoRatio;
    }

    toRequestJSON() {
        let signals = []
        for (let buySignal of this.strategy.buySignals) {
            signals.push(buySignal.toJSON(true));
        }
        for (let sellSignal of this.strategy.sellSignals) {
            signals.push(sellSignal.toJSON(false));
        }

        return JSON.stringify({
            symbol: this.strategy.symbol,
            interval: this.strategy.interval,
            start_date: this.startDate.toISOString(),
            end_date: this.endDate.toISOString(),
            signals: signals
        })
    }

    updateFromData(data: BacktestResponseDataFormat): Backtest {
        const dataResult: BacktestResultDataFormat[] = data.result;

        let dataStockValues: StockValue[] = [];
        let dataIndicatorValues: Record<string, IndicatorValue[]> = {};
        let dataTrades: Trade[] = [];
        let dataReturnValues: ReturnValue[] = [];

        let owned = 0;
        if (dataResult.length > 0) {
            const firstDatum = dataResult[0]
            if (firstDatum.indicators) {
                for (const [key, value] of Object.entries(firstDatum.indicators)) {
                    dataIndicatorValues[key] = [];
                }
            }
        }

        for (const datum of dataResult) {
            const datumDate: Date = new Date(datum.datetime);

            const newStockValue = new StockValue(this.strategy.symbol, datumDate, datum.close)
            dataStockValues.push(newStockValue);
            dataReturnValues.push(new ReturnValue(datumDate, datum.return));
            if (!owned && datum.owned) {
                dataTrades.push(new Trade(datumDate, datum.close, true));
            }
            else if (owned && !datum.owned) {
                dataTrades.push(new Trade(datumDate, datum.close, false));
            }
            owned = datum.owned;

            if (datum.indicators) {
                for (const [key, value] of Object.entries(datum.indicators)) {
                    dataIndicatorValues[key].push(new IndicatorValue(key, datumDate, value));
                }
            }
        }
        
        this.stockValues = dataStockValues;
        this.indicatorValues = dataIndicatorValues;
        this.strategy.trades = dataTrades;
        this.indicatorValues = dataIndicatorValues;
        this.returnValues = dataReturnValues;
        this.resultImage = data.image;
        this.sharpeRatio = data.sharpe_ratio;
        this.sortinoRatio = data.sortino_ratio;

        return this;
    }
}