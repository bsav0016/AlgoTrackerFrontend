import { IndicatorData, indicators } from "../enums/Indicator";

export interface SignalData {
    name: string;
    target_value: number;
    above_target: boolean;
    window: number | null;
    fast_window: number | null;
    slow_window: number | null;
    signal_window: number | null;
}

export class Signal {
    indicator: IndicatorData;
    targetValue: number;
    aboveTarget: boolean;
    window: number | null;
    fastWindow: number | null;
    slowWindow: number | null;
    signalWindow: number | null;

    constructor(
        indicator: IndicatorData,
        targetValue: number,
        aboveTarget: boolean,
        window: number | null,
        fastWindow: number | null,
        slowWindow: number | null,
        signalWindow: number | null
    ) {
        this.indicator = indicator;
        this.targetValue = targetValue;
        this.aboveTarget = aboveTarget;
        this.window = window;
        this.fastWindow = fastWindow;
        this.slowWindow = slowWindow;
        this.signalWindow = signalWindow;   
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
            data.signal_window
        )
    }

    toJSON(buySignal: boolean): Record<string, any> {
        return {
            name: this.indicator.name,
            above_target: this.aboveTarget,
            buy_signal: buySignal,
            target_value: this.targetValue,
            window: this.window,
            fast_window: this.fastWindow,
            slow_window: this.slowWindow,
            signal_window: this.signalWindow
        };;
    }
}