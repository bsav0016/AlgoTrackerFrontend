export class RevenueCatDepositDTO {
    transactionId: string;

    constructor(
        transactionId: string
    ) {
        this.transactionId = transactionId;
    }

    jsonify() {
        return JSON.stringify({
            transaction_id: this.transactionId
        });
    }
}