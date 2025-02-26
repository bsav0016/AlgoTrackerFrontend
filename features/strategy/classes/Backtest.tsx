import { IndicatorValue } from "./IndicatorValue";
import { ReturnValue } from "./ReturnValue";
import { StockValue } from "./StockValue";
import { Strategy } from "./Strategy";
import { Trade } from "./Trade";

export interface BacktestResponseDataFormat {
    result: BacktestResultDataFormat[];
}

interface BacktestResultDataFormat {
    datetime: string;
    close: number;
    indicators?: { [key: string]: number };
    buy: boolean;
    sell: boolean;
    owned: number;
    return: number;
}

export class Backtest {
    strategy: Strategy;
    startDate: Date;
    endDate: Date;
    stockValues: StockValue[];
    indicatorValues: Record<string, IndicatorValue[]>;
    returnValues: ReturnValue[];

    constructor(
        strategy: Strategy,
        startDate: Date,
        endDate: Date,
        stockValues: StockValue[],
        indicatorValues: Record<string, IndicatorValue[]>,
        returnValues: ReturnValue[]
    ) {
        this.strategy = strategy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.stockValues = stockValues;
        this.indicatorValues = indicatorValues;
        this.returnValues = returnValues;
    }

    toNavigationJSON() {
        return JSON.stringify({
            strategy: this.strategy.toNavigationJSON(),
            startDate: this.startDate.toISOString(),
            endDate: this.endDate.toISOString(),
            stockValues: this.stockValues.map((sv) => sv.toNavigationJSON()),
            indicatorValues: Object.fromEntries(
                Object.entries(this.indicatorValues).map(([key, values]) => [
                    key,
                    values.map((iv) => iv.toNavigationJSON()),
                ])
            ),
            returnValues: this.returnValues.map((rv) => rv.toNavigationJSON()),
        });
    }

    static fromNavigationJSON(jsonString: string): Backtest {
        const data = JSON.parse(jsonString);
        return new Backtest(
            Strategy.fromNavigationJSON(data.strategy),
            new Date(data.startDate),
            new Date(data.endDate),
            data.stockValues.map((sv: any) => StockValue.fromNavigationJSON(sv)),
            Object.fromEntries(
                Object.entries(data.indicatorValues).map(([key, values]: [string, unknown]) => [
                    key,
                    (values as any[]).map((iv: any) => IndicatorValue.fromNavigationJSON(iv)),
                ])
            ),
            data.returnValues.map((rv: any) => ReturnValue.fromNavigationJSON(rv))
        );
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
                dataTrades.push(new Trade(newStockValue, true));
            }
            else if (owned && !datum.owned) {
                dataTrades.push(new Trade(newStockValue, false));
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

        return this;
    }
}