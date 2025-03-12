export class IndicatorValue {
    indicatorString: string;
    date: Date;
    value: number;

    constructor (
        indicatorString: string,
        date: Date,
        value: number
    ) {
        this.indicatorString = indicatorString;
        this.date = date;
        this.value = value;
    }
} 