export interface TradeData {
    date: string;
    price: number;
    is_buy: boolean;
}

export class Trade {
    date: Date;
    price: number;
    isBuy: boolean;

    constructor(
        date: Date,
        price: number,
        isBuy: boolean
    ) {
        this.date = date;
        this.price = price;
        this.isBuy = isBuy;
    }

    static fromData(data: TradeData): Trade {
        return new Trade(
            new Date(data.date),
            data.price,
            data.is_buy
        )
    }
}