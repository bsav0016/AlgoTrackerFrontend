import { IndicatorData, indicators } from "../enums/Indicator";

export interface SignalData {
    name: string;
    target_value: number;
    above_target: boolean;
    window: number | null;
    fast_window: number | null;
    slow_window: number | null;
    signal_window: number | null;
    version?: number;
    /** Set when the rule compares its indicator with a second one instead of a number. */
    compare_to?: { name: string; window: number } | null;
}

/** The second indicator of a rule that compares two: a price average and its window. */
export interface SignalComparison {
    indicator: IndicatorData;
    window: number;
}

/** Throws for an indicator this version of the app does not know, like Signal.fromData does for the first one. */
function comparisonFromData(data: SignalData["compare_to"]): SignalComparison | null {
    if (!data) return null;
    const indicator = indicators.find(ind => ind.name === data.name);
    if (!indicator) {
        throw new Error(`Invalid indicator value: ${data.name}`);
    }
    return { indicator, window: data.window };
}

export const CURRENT_SIGNAL_VERSION = 2;
export const LEGACY_SIGNAL_VERSION = 1;

export class Signal {
    indicator: IndicatorData;
    targetValue: number;
    aboveTarget: boolean;
    window: number | null;
    fastWindow: number | null;
    slowWindow: number | null;
    signalWindow: number | null;
    /** 1 is the original indicator definitions, 2 the standard RSI/ADX/MACD. Old strategies keep 1. */
    version: number;
    /** What the indicator is compared with when that is another indicator; then `targetValue` is not used. */
    compareTo: SignalComparison | null;

    constructor(
        indicator: IndicatorData,
        targetValue: number,
        aboveTarget: boolean,
        window: number | null,
        fastWindow: number | null,
        slowWindow: number | null,
        signalWindow: number | null,
        version: number = CURRENT_SIGNAL_VERSION,
        compareTo: SignalComparison | null = null
    ) {
        this.indicator = indicator;
        this.targetValue = targetValue;
        this.aboveTarget = aboveTarget;
        this.window = window;
        this.fastWindow = fastWindow;
        this.slowWindow = slowWindow;
        this.signalWindow = signalWindow;
        this.version = version;
        this.compareTo = compareTo;
    }

    static fromData(data: SignalData): Signal {
        const indicator = indicators.find(ind => ind.name === data.name);
        if (!indicator) {
            throw new Error(`Invalid indicator value: ${data.name}`);
        }
            
        return new Signal(
            indicator,
            data.target_value,
            data.above_target,
            data.window,
            data.fast_window,
            data.slow_window,
            data.signal_window,
            data.version ?? LEGACY_SIGNAL_VERSION,
            comparisonFromData(data.compare_to)
        )
    }

    /** An independent copy, so the builder can edit one without changing the run it came from. */
    clone(): Signal {
        return new Signal(
            this.indicator, this.targetValue, this.aboveTarget, this.window, this.fastWindow, this.slowWindow,
            this.signalWindow, this.version, this.compareTo ? { ...this.compareTo } : null
        );
    }

    toJSON(buySignal: boolean, version: number = this.version): Record<string, any> {
        const json: Record<string, any> = {
            name: this.indicator.name,
            above_target: this.aboveTarget,
            buy_signal: buySignal,
            target_value: this.targetValue,
            window: this.window,
            fast_window: this.fastWindow,
            slow_window: this.slowWindow,
            signal_window: this.signalWindow,
            version
        };
        // Only a comparison rule sends it, so every other rule is sent exactly as before.
        if (this.compareTo) {
            json.compare_to = { name: this.compareTo.indicator.name, window: this.compareTo.window };
            json.target_value = 0;
        }
        return json;
    }
}