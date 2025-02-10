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
}