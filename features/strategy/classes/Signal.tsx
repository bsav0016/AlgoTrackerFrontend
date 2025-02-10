import { Indicator } from "../enums/Indicator";

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
}