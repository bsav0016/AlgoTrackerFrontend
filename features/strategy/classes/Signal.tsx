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

    constructor(
        indicator: IndicatorData,
        targetValue: number,
        aboveTarget: boolean,
        window: number | null,
        fastWindow: number | null,
        slowWindow: number | null,
        signalWindow: number | null,
        version: number = CURRENT_SIGNAL_VERSION
    ) {
        this.indicator = indicator;
        this.targetValue = targetValue;
        this.aboveTarget = aboveTarget;
        this.window = window;
        this.fastWindow = fastWindow;
        this.slowWindow = slowWindow;
        this.signalWindow = signalWindow;
        this.version = version;
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
            data.version ?? LEGACY_SIGNAL_VERSION
        )
    }

    toJSON(buySignal: boolean, version: number = this.version): Record<string, any> {
        return {
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
    }
}