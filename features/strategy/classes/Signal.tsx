import { Indicator } from "../enums/Indicator";

export interface SignalData {
    indicator: string;
    target_value: number;
    above_target: boolean;
    parameters: Record<string, number>;
}

export class Signal {
    indicator: Indicator;
    targetValue: number;
    aboveTarget: boolean;
    parameters: Record<string, number>;

    constructor(
        indicator: Indicator,
        targetValue: number,
        aboveTarget: boolean,
        parameters: Record<string, number>
    ) {
        this.indicator = indicator;
        this.targetValue = targetValue;
        this.aboveTarget = aboveTarget;
        this.parameters = parameters
    }

    toNavigationJSON(): string {
        return JSON.stringify({
            indicator: this.indicator,
            targetValue: this.targetValue,
            aboveTarget: this.aboveTarget,
            parameters: this.parameters
        });
    }
    
    static fromNavigationJSON(jsonString: string): Signal {
        const data = JSON.parse(jsonString);
        return new Signal(
            data.indicator as Indicator,
            data.targetValue,
            data.aboveTarget,
            data.parameters
        );
    }

    static fromData(data: SignalData): Signal {
        const indicator = Object.values(Indicator).includes(data.indicator as Indicator)
            ? (data.indicator as Indicator)
            : (() => {
                throw new Error(`Invalid indicator value: ${data.indicator}`);
            })();

        const parameters = data.parameters as Record<string, number>;
            
        return new Signal(
            indicator,
            data.target_value,
            data.above_target,
            parameters
        )
    }

    toJSON(buySignal: boolean) {
        let dictionary: Record<string, any> = {
            name: this.indicator,
            above_target: this.aboveTarget,
            buy_signal: buySignal,
            target_value: this.targetValue
        };
        
        if ("Window" in this.parameters) {
            dictionary.window = this.parameters["Window"];
        }
        if ("Fast Window" in this.parameters) {
            dictionary.fast_window = this.parameters["Fast Window"]
        }
        if ("Slow Window" in this.parameters) {
            dictionary.slow_window = this.parameters["Slow Window"]
        }
        if ("Signal Window" in this.parameters) {
            dictionary.signal_window = this.parameters["Signal Window"]
        }
        return dictionary;
    }
}