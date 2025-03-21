export interface Interval {
    interval: string;
    monthly_charge: number;
}

export interface SymbolsAndIntervalsResponseData {
    symbols: string[];
    intervals: Interval[];
    backtest_base_cost: number;
    backtest_iterations: number;
}

export class SymbolsAndIntervalsResponseDTO {
    symbols: string[];
    intervals: Interval[];
    backtestBaseCost: number;
    backtestIterations: number;

    constructor(
        symbols: string[],
        intervals: Interval[],
        backtestBaseCost: number,
        backtestIterations: number
    ) {
        this.symbols = symbols;
        this.intervals = intervals;
        this.backtestBaseCost = backtestBaseCost;
        this.backtestIterations = backtestIterations
    }

    static fromData(data: SymbolsAndIntervalsResponseData) {
        return new SymbolsAndIntervalsResponseDTO(
            data.symbols,
            data.intervals,
            data.backtest_base_cost,
            data.backtest_iterations
        );
    }
}