export interface PaymentSheetResponseData {
    payment_intent: string;
    ephemeral_key: string;
    customer: string;
}

export class PaymentSheetResponseDTO {
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;

    constructor(
        paymentIntent: string,
        ephemeralKey: string,
        customer: string
    ) {
        this.paymentIntent = paymentIntent;
        this.ephemeralKey = ephemeralKey;
        this.customer = customer
    }

    static fromData(data: PaymentSheetResponseData): PaymentSheetResponseDTO {
        return new PaymentSheetResponseDTO(
            data.payment_intent,
            data.ephemeral_key,
            data.customer
        )
    }
}