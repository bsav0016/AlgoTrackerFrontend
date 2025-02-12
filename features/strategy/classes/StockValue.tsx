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

    static fromData(data: StockValueData): StockValue {
        const date = new Date(data.date);

        return new StockValue(
            data.symbol,
            date,
            data.price
        )
    }
}