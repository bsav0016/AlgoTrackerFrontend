export interface StockValueData {
    symbol: string;
    date: string;
    price: number;
}

export class StockValue {
    symbol: string;
    date: Date
    price: number

    constructor(
        symbol: string,
        date: Date,
        price: number
    ) {
        this.symbol = symbol
        this.date = date
        this.price = price
    }

    toNavigationJSON(): string {
        return JSON.stringify({
            symbol: this.symbol,
            date: this.date.toISOString(),
            price: this.price
        });
    }
    
    static fromNavigationJSON(jsonString: string): StockValue {
        const data = JSON.parse(jsonString);
        return new StockValue(
            data.symbol,
            new Date(data.date),
            data.price
        );
    }

    static fromData(data: StockValueData): StockValue {
        const date = new Date(data.date);

        return new StockValue(
            data.symbol,
            date,
            data.price
        )
    }
}