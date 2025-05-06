import Constants from 'expo-constants';

export const DB_URL = (Constants.expoConfig?.extra?.API_URL || '') + 'api/';

export const ACCEPTABLE_STATUS_CODES: number[] = [200, 201]

export const HEADERS = (token: string | null = null) => {
    return {
        JSON: {'Content-Type': 'application/json'},
        AUTH: {'Authorization': `Bearer ${token}`}
    }
}

export const URL_EXT = {
    LOGIN: 'login/',
    REGISTER: 'register/',
    PROMO_CODE_AVAILABILITY: 'promo-code-availability/',
    LOGOUT: 'logout/',
    DELETE_ACCOUNT: 'delete-account/',
    USER_DETAILS: 'user-details/',
    TOKEN_REFRESH: 'token/refresh/',
    BACKTEST: 'backtest/',
    STRATEGY: 'strategy/',
    DEVICE_ID: 'device-id/',
    SYMBOLS_AND_INTERVALS: 'symbols-and-intervals/',
    PASSWORD_RESET: 'password-reset/',
    PASSWORD_RESET_CONFIRM: 'password-reset-confirm/',
    PAYMENT_INTENT: 'payment-intent/',
    REVENUECAT_CUSTOMER: 'revenuecat-customer/',
}
