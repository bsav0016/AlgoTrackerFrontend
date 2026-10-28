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
    /** Present only when the server rotates refresh tokens; it replaces the one that was sent. */
    refresh?: string;
}