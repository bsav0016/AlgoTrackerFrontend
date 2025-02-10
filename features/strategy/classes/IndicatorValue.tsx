import { Indicator } from "../enums/Indicator";

export class IndicatorValue {
    indicator: Indicator;
    date: Date;
    value: number;

    constructor (
        indicator: Indicator,
        date: Date,
        value: number
    ) {
        this.indicator = indicator;
        this.date = date;
        this.value = value;
    }
} 