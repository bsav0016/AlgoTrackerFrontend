export class TokenRefreshDTO {
    refreshToken: string;

    constructor(refreshToken: string) {
        this.refreshToken = refreshToken;
    }

    jsonify() {
        return JSON.stringify({
            refresh: this.refreshToken
        });
    }
}

export interface TokenRefreshResponseData{
    access: string;
}