import { Signal, SignalData } from "@/features/strategy/classes/Signal";

/** What anyone with a share link may see. It is exactly the backend's public view: no id, no owner, no trades. */
export interface SharedStrategyData {
    title: string;
    symbol: string;
    interval: string;
    buy_signals: SignalData[];
    sell_signals: SignalData[];
    strategy_return: number | string;
    asset_return: number | string;
}

export interface SharedStrategy {
    title: string;
    symbol: string;
    interval: string;
    buySignals: Signal[];
    sellSignals: Signal[];
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
        // The backend sends decimals as strings.
        strategyReturn: Number(data.strategy_return),
        assetReturn: Number(data.asset_return),
    };
}

/** One rule in words, e.g. "RSI (14) is below 30". */
export function describeSignal(signal: Signal): string {
    const windows = [signal.window, signal.fastWindow, signal.slowWindow, signal.signalWindow].filter((w) => w !== null);
    const args = windows.length ? ` (${windows.join(", ")})` : "";
    return `${signal.indicator.displayName}${args} is ${signal.aboveTarget ? "above" : "below"} ${signal.targetValue}`;
}
