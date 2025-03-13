export class PaymentSheetDTO {
    amount: number;

    constructor(
        amount: number
    ) {
        this.amount = amount;
    }

    jsonify() {
        return JSON.stringify({
            amount: this.amount
        })
    }
}