export class ReturnValue {
    date: Date
    returnValue: number

    constructor(
        date: Date,
        returnValue: number
    ) {
        this.date = date
        this.returnValue = returnValue
    }

    toNavigationJSON(): string {
        return JSON.stringify({
            date: this.date.toISOString(),
            returnValue: this.returnValue
        });
    }
    
    static fromNavigationJSON(jsonString: string): ReturnValue {
        const data = JSON.parse(jsonString);
        return new ReturnValue(
            new Date(data.date),
            data.returnValue
        );
    }
}