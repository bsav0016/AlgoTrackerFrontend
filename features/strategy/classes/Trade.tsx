export interface TradeData {
    date: string;
    price: number;
    is_buy: boolean;
    // The exit rule that made this sell, empty for a sell signal. Older servers do not send it.
    exit_reason?: string;
}

export class Trade {
    date: Date;
    price: number;
    isBuy: boolean;
    exitReason: string | null;

    constructor(
        date: Date,
        price: number,
        isBuy: boolean,
        exitReason: string | null = null
    ) {
        this.date = date;
        this.price = price;
        this.isBuy = isBuy;
        this.exitReason = exitReason;
    }

    static fromData(data: TradeData): Trade {
        return new Trade(
            new Date(data.date),
            data.price,
            data.is_buy,
            data.exit_reason || null
        )
    }
}