import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { PaymentSheetDTO } from "./dtos/PaymentSheetDTO"
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { PaymentSheetResponseData, PaymentSheetResponseDTO } from "./dtos/PaymentSheetResponseDTO";
import { RevenueCatDepositDTO } from "./dtos/RevenueCatDepositDTO";

export const PaymentService = {
    async fetchPaymentSheetParams(accessToken: string, amount: number) {
        const body = new PaymentSheetDTO(amount).jsonify();
        const headers = {
            ...HEADERS().JSON,
            ...HEADERS(accessToken).AUTH
        };
        try {
            const response = await networkRequest(
                URL_EXT.PAYMENT_INTENT,
                RequestMethod.POST,
                headers,
                body
            );
            const data = response.data as PaymentSheetResponseData;
            return PaymentSheetResponseDTO.fromData(data);
        } catch (error) {
            throw error;
        }
    },

    async processRevenueCatDeposit(accessToken: string, transactionId: string) {
        const body = new RevenueCatDepositDTO(transactionId).jsonify();
        const headers = {
            ...HEADERS().JSON,
            ...HEADERS(accessToken).AUTH
        };
        try {
            await networkRequest(
                URL_EXT.REVENUECAT_DEPOSIT,
                RequestMethod.POST,
                headers,
                body
            );
        } catch (error) {
            throw error;
        }
    }
}