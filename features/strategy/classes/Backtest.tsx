import { IndicatorValue } from "./IndicatorValue";
import { ReturnValue } from "./ReturnValue";
import { StockValue } from "./StockValue";
import { Strategy } from "./Strategy";
import { Trade } from "./Trade";

export interface DataWindowFormat {
    requested_start: string;
    requested_end: string;
    covered_start: string;
    covered_end: string;
    candles: number;
    requests: number;
    truncated: boolean;
    reason: "request_limit" | "history_ends" | null;
}

export interface BacktestResponseDataFormat {
    result: BacktestResultDataFormat[];
    image: string;
    image_no_signals: string;
    percent_return: number;
    percent_return_adj: number;
    sharpe_ratio: number;
    sharpe_ratio_adj: number;
    sortino_ratio: number;
    sortino_ratio_adj: number;
    period_return?: number;
    period_return_adj?: number;
    period_return_before_costs?: number;
    annualized_is_extrapolated?: boolean;
    trade_cost_percent?: number;
    trades?: number;
    data_window?: DataWindowFormat;
    user_account_credits: number;
    user_monthly_credits: number;
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
    resultImage: string | null;
    resultImageNoSignals: string | null;
    percentReturn: number | null;
    percentReturnAdj: number | null;
    sharpeRatio: number | null;
    sharpeRatioAdj: number | null;
    sortinoRatio: number | null;
    sortinoRatioAdj: number | null;
    periodReturn: number | null = null;
    periodReturnAdj: number | null = null;
    periodReturnBeforeCosts: number | null = null;
    annualizedIsExtrapolated = false;
    tradeCostPercent: number | null = null;
    tradeCount: number | null = null;
    dataWindow: DataWindowFormat | null = null;

    constructor(
        strategy: Strategy,
        startDate: Date,
        endDate: Date,
        stockValues: StockValue[] = [],
        indicatorValues: Record<string, IndicatorValue[]> = {},
        returnValues: ReturnValue[] = [],
        resultImage: string | null = null,
        resultImageNoSignals: string | null = null,
        percentReturn: number | null = null,
        percentReturnAdj: number | null = null,
        sharpeRatio: number | null = null,
        sharpeRatioAdj: number | null = null,
        sortinoRatio: number | null = null,
        sortinoRatioAdj: number | null = null
    ) {
        this.strategy = strategy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.stockValues = stockValues;
        this.indicatorValues = indicatorValues;
        this.returnValues = returnValues;
        this.resultImage = resultImage;
        this.resultImageNoSignals = resultImageNoSignals;
        this.percentReturn = percentReturn;
        this.percentReturnAdj = percentReturnAdj;
        this.sharpeRatio = sharpeRatio;
        this.sharpeRatioAdj = sharpeRatioAdj;
        this.sortinoRatio = sortinoRatio;
        this.sortinoRatioAdj = sortinoRatioAdj;
    }

    toRequestJSON() {
        const version = this.strategy.signalVersion();
        let signals = []
        for (let buySignal of this.strategy.buySignals) {
            signals.push(buySignal.toJSON(true, version));
        }
        for (let sellSignal of this.strategy.sellSignals) {
            signals.push(sellSignal.toJSON(false, version));
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
        this.resultImageNoSignals = data.image_no_signals;
        this.percentReturn = data.percent_return;
        this.percentReturnAdj = data.percent_return_adj;
        this.sharpeRatio = data.sharpe_ratio;
        this.sharpeRatioAdj = data.sharpe_ratio_adj;
        this.sortinoRatio = data.sortino_ratio;
        this.sortinoRatioAdj = data.sortino_ratio_adj;
        this.periodReturn = data.period_return ?? null;
        this.periodReturnAdj = data.period_return_adj ?? null;
        this.periodReturnBeforeCosts = data.period_return_before_costs ?? null;
        this.annualizedIsExtrapolated = data.annualized_is_extrapolated ?? false;
        this.tradeCostPercent = data.trade_cost_percent ?? null;
        this.tradeCount = data.trades ?? null;
        this.dataWindow = data.data_window ?? null;

        return this;
    }
}