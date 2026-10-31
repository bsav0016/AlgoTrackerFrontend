import Constants from "expo-constants";

// The backend makes ids with secrets.token_urlsafe(16): letters, digits, "-" and "_". Anything else is not a share
// id, and is never put into a request address.
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isShareId(value: unknown): value is string {
    return typeof value === "string" && SHARE_ID_PATTERN.test(value);
}

/** The address people open: the API's public address plus /s/<id>, which the backend serves as a web page with a
 *  preview card. */
export function shareUrl(shareId: string): string {
    const base = String(Constants.expoConfig?.extra?.API_URL || "").replace(/\/+$/, "");
    return `${base}/s/${shareId}`;
}

export const SHARE_DISCLAIMER = "Past results are not a prediction of future results. This is not financial advice.";

/** What to hand the native share sheet. iOS shows `url` as its own item, so the text must not repeat it; Android
 *  takes only the text, so the link goes inside it. */
export function sharePayload(title: string, url: string, platform: string): { message: string; url?: string } {
    const text = `Check out my "${title}" strategy on AlgoTracker`;
    return platform === "ios" ? { message: text, url } : { message: `${text}: ${url}` };
}
