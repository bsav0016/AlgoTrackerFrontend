import { IndicatorValue } from "./IndicatorValue";
import { ReturnValue } from "./ReturnValue";
import { StockValue } from "./StockValue";
import { Strategy } from "./Strategy";
import { Trade } from "./Trade";
import { hasExitRules, exitRulesToJSON, exitRulesFromData, summarizeExits } from "./ExitRules";
import { Signal, SignalData } from "./Signal";
import { SeriesPoint } from "../chart/chartMath";
import { PlainNumbers, PlainNumbersData, plainNumbersFromData } from "../plainWords";

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

export interface BacktestResponseDataFormat extends PlainNumbersData {
    // The saved copy of this run (null if the server could not save it). Older servers do not send it.
    id?: number | null;
    result: BacktestResultDataFormat[];
    // Prerendered charts, sent only to builds that ask for them; this app draws the chart from `result`.
    image?: string;
    image_no_signals?: string;
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
    // Not sent for a saved run, which keeps only what the chart and the trades need.
    buy?: boolean;
    sell?: boolean;
    owned: number;
    return: number;
    // The exit rule that sold on this candle, empty otherwise. Older servers do not send it.
    exit_reason?: string;
}

/** A backtest's numbers and rows, without the credit balances that only come back with a fresh run. */
export type BacktestResultsData = Omit<BacktestResponseDataFormat, "user_account_credits" | "user_monthly_credits">;

/** GET /api/backtests/<id>/: a saved run in the shape of a backtest response, plus the request that made it. */
export interface SavedBacktestDetailData extends BacktestResultsData {
    id: number;
    label: string;
    created_at: string;
    symbol: string;
    interval: string;
    requested_start: string;
    requested_end: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    exit_rules?: Record<string, number>;
    next_candle_execution: boolean;
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
    exitSummary: string | null = null;
    /** Biggest drop, winning trades and time invested; null for a run saved before the server worked them out. */
    plain: PlainNumbers | null = null;
    /** The id of the saved copy, once there is one. */
    id: number | null = null;
    label = "";
    /** When the saved copy was made; only known for a run that was reopened from My backtests. */
    savedAt: Date | null = null;

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
            signals: signals,
            include_images: false,
            ...(hasExitRules(this.strategy.exitRules) ? { exit_rules: exitRulesToJSON(this.strategy.exitRules) } : {})
        })
    }

    /**
     * A run reopened from My backtests: the same object a fresh backtest would have produced, built from what the
     * server kept (the request and the thinned rows), so the results screen needs no special case.
     */
    static fromSaved(data: SavedBacktestDetailData): Backtest {
        const strategy = new Strategy(
            -1, '', data.symbol, data.interval,
            data.buy_signals.map((signal) => Signal.fromData(signal)),
            data.sell_signals.map((signal) => Signal.fromData(signal)),
            [], 1, 1, 1, undefined, true, null, exitRulesFromData(data.exit_rules)
        );
        const backtest = new Backtest(strategy, new Date(data.requested_start), new Date(data.requested_end));
        backtest.updateFromData(data);
        backtest.label = data.label;
        backtest.savedAt = new Date(data.created_at);
        return backtest;
    }

    /** The asset price and the strategy's value at each candle, for the chart. */
    chartPoints(): SeriesPoint[] {
        const length = Math.min(this.stockValues.length, this.returnValues.length);
        const points: SeriesPoint[] = [];
        for (let i = 0; i < length; i++) {
            points.push({
                time: this.stockValues[i].date.getTime(),
                price: this.stockValues[i].price,
                value: this.returnValues[i].returnValue,
            });
        }
        return points;
    }

    updateFromData(data: BacktestResultsData): Backtest {
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
                dataTrades.push(new Trade(datumDate, datum.close, false, datum.exit_reason || null));
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
        this.resultImage = data.image || null;
        this.resultImageNoSignals = data.image_no_signals || null;
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
        this.id = data.id ?? null;
        this.exitSummary = summarizeExits(dataTrades.map((trade) => trade.exitReason));
        this.plain = plainNumbersFromData(data);

        return this;
    }
}