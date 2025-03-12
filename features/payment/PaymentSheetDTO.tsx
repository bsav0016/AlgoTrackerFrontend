export class PaymentSheetDTO {
    amount: number;

    constructor(
        amount: number
    ) {
        this.amount = Math.floor(amount * 100);
    }

    jsonify() {
        return JSON.stringify({
            amount: this.amount
        })
    }
}