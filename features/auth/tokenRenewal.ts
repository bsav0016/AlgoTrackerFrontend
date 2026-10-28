/**
 * Gets a new access token with the stored refresh token and keeps the refresh token current.
 *
 * When the server rotates refresh tokens, each renewal returns a new one and the old one stops working, so
 * the new one must be saved before the next renewal. Two renewals running at once would both present the
 * same old token and the second would be refused, so a renewal that is already in flight is shared.
 */
export interface TokenRenewalDeps {
    readRefresh: () => Promise<string | null>;
    saveRefresh: (refreshToken: string) => Promise<void>;
    renew: (refreshToken: string) => Promise<{ access: string; refresh: string | null }>;
}

export function createTokenRenewer({ readRefresh, saveRefresh, renew }: TokenRenewalDeps) {
    let inFlight: Promise<string | null> | null = null;

    return function renewAccessToken(): Promise<string | null> {
        if (inFlight) return inFlight;
        inFlight = (async () => {
            const stored = await readRefresh();
            if (!stored) return null;
            const { access, refresh } = await renew(stored);
            if (refresh && refresh !== stored) await saveRefresh(refresh);
            return access;
        })().finally(() => {
            inFlight = null;
        });
        return inFlight;
    };
}
