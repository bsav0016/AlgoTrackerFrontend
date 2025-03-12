import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { PaymentSheetDTO } from "./PaymentSheetDTO"
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { PaymentSheetResponseData, PaymentSheetResponseDTO } from "./PaymentSheetResponseDTO";

export const PaymentService = {
    async fetchPaymentSheetParams(amount: number) {
        const body = new PaymentSheetDTO(amount).jsonify();
        const headers = {
            ...HEADERS().JSON
        };
        const response = await networkRequest(
            URL_EXT.PAYMENT_INTENT,
            RequestMethod.POST,
            headers,
            body
        );
        const data = response.data as PaymentSheetResponseData;
        return PaymentSheetResponseDTO.fromData(data);
    }
}