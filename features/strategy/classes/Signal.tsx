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
}