import { Signal, SignalData } from "@/features/strategy/classes/Signal";
import { ExitRules, exitRulesFromData } from "@/features/strategy/classes/ExitRules";

/** What anyone with a share link may see. It is exactly the backend's public view: no id, no owner, no trades. */
export interface SharedStrategyData {
    title: string;
    symbol: string;
    interval: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    exit_rules?: ExitRules;
    // When the owner last changed the rules; null if they never have. Older servers do not send it.
    rules_changed_at?: string | null;
    strategy_return: number | string;
    asset_return: number | string;
}

export interface SharedStrategy {
    title: string;
    symbol: string;
    interval: string;
    buySignals: Signal[];
    sellSignals: Signal[];
    exitRules: ExitRules;
    rulesChangedAt: Date | null;
    strategyReturn: number;
    assetReturn: number;
}

/** Throws if a rule names an indicator this version of the app does not know (Signal.fromData does). */
export function sharedStrategyFromData(data: SharedStrategyData): SharedStrategy {
    return {
        title: data.title,
        symbol: data.symbol,
        interval: data.interval,
        buySignals: data.buy_signals.map((signal) => Signal.fromData(signal)),
        sellSignals: data.sell_signals.map((signal) => Signal.fromData(signal)),
        exitRules: exitRulesFromData(data.exit_rules),
        rulesChangedAt: data.rules_changed_at ? new Date(data.rules_changed_at) : null,
        // The backend sends decimals as strings.
        strategyReturn: Number(data.strategy_return),
        assetReturn: Number(data.asset_return),
    };
}

/** One rule in words, e.g. "RSI (14) is below 30", or "The 20-candle simple average is above the 50-candle simple average". */
export function describeSignal(signal: Signal): string {
    if (signal.compareTo) {
        const word = (indicator: Signal["indicator"]) => indicator.averageWord ?? indicator.displayName;
        return `The ${signal.window}-candle ${word(signal.indicator)} is ${signal.aboveTarget ? "above" : "below"} `
            + `the ${signal.compareTo.window}-candle ${word(signal.compareTo.indicator)}`;
    }
    const windows = [signal.window, signal.fastWindow, signal.slowWindow, signal.signalWindow].filter((w) => w !== null);
    const args = windows.length ? ` (${windows.join(", ")})` : "";
    return `${signal.indicator.displayName}${args} is ${signal.aboveTarget ? "above" : "below"} ${signal.targetValue}`;
}
