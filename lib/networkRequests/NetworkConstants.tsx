const DEV_ENV: Boolean = true

const URL: string = DEV_ENV 
    ? "http://192.168.1.144:8000/"
    : "" //TODO: Insert true backend url here
export const DB_URL = URL + "api/"

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
    LOGOUT: 'logout/',
    BACKTEST: 'backtest/',
    STRATEGY: 'strategy/',
    DEVICE_ID: 'device-id/'
}
