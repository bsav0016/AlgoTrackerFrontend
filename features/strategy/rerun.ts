import { Backtest } from "./classes/Backtest";
import { ExitRuleInputs, exitRulesToInputs } from "./classes/ExitRules";
import { Signal } from "./classes/Signal";

/** A date as the builder's three boxes hold it: month 1-12, day, four-digit year, with no padding. */
export interface DateParts {
    month: string;
    day: string;
    year: string;
}

/** The date a person typed, read back in the phone's own time zone (the builder builds its dates the same way). */
export function dateParts(date: Date): DateParts {
    return { month: String(date.getMonth() + 1), day: String(date.getDate()), year: String(date.getFullYear()) };
}

/** Everything the builder needs to start from an earlier backtest. Signals are copies, so editing them in the builder
 *  cannot change the run it came from. */
export interface BuilderSeed {
    symbol: string;
    interval: string;
    buySignals: Signal[];
    sellSignals: Signal[];
    exitRuleInputs: ExitRuleInputs;
    startDate: DateParts;
    endDate: DateParts;
}

export function builderSeedFrom(backtest: Backtest): BuilderSeed {
    const { strategy } = backtest;
    return {
        symbol: strategy.symbol,
        interval: strategy.interval,
        buySignals: strategy.buySignals.map((signal) => signal.clone()),
        sellSignals: strategy.sellSignals.map((signal) => signal.clone()),
        exitRuleInputs: exitRulesToInputs(strategy.exitRules),
        startDate: dateParts(backtest.startDate),
        endDate: dateParts(backtest.endDate),
    };
}
