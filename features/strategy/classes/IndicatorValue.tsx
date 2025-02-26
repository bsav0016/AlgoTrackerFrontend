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

    toNavigationJSON(): string {
        return JSON.stringify({
            indicatorString: this.indicatorString,
            date: this.date.toISOString(),
            value: this.value
        });
    }
    
    static fromNavigationJSON(jsonString: string): IndicatorValue {
        const data = JSON.parse(jsonString);
        return new IndicatorValue(
            data.indicatorString,
            new Date(data.date),
            data.value
        );
    }
} 