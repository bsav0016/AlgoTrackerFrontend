import { Indicator } from "../enums/Indicator";

export interface SignalData {
    indicator: string;
    target_value: number;
    above_target: boolean;
}

export class Signal {
    indicator: Indicator;
    targetValue: number;
    aboveTarget: boolean;

    constructor(
        indicator: Indicator,
        targetValue: number,
        aboveTarget: boolean
    ) {
        this.indicator = indicator;
        this.targetValue = targetValue;
        this.aboveTarget = aboveTarget;
    }

    static fromData(data: SignalData): Signal {
        const indicator = Object.values(Indicator).includes(data.indicator as Indicator)
            ? (data.indicator as Indicator)
            : (() => {
                throw new Error(`Invalid indicator value: ${data.indicator}`);
            })();
            
        return new Signal(
            indicator,
            data.target_value,
            data.above_target
        )
    }
}