export class RevenueCatCustomerDTO {
    customerId: string;

    constructor(
        customerId: string
    ) {
        this.customerId = customerId;
    }

    jsonify() {
        return JSON.stringify({
            customer_id: this.customerId
        });
    }
}