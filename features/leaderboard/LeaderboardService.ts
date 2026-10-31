import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { Board, BoardData, BoardGroup, BoardKind, boardFromData } from "./Leaderboard";

export interface BoardQuery {
    kind: BoardKind;
    group: BoardGroup;
    /** A published Monday (YYYY-MM-DD); only for weekly boards. The default is the latest finished week. */
    week?: string | null;
    limit?: number;
}

export const LeaderboardService = {
    async getBoard(query: BoardQuery, token: string): Promise<Board> {
        const params = new URLSearchParams({ kind: query.kind, group: query.group });
        if (query.kind === "week" && query.week) params.set("week", query.week);
        if (query.limit) params.set("limit", String(query.limit));
        const response = await networkRequest(
            `${URL_EXT.LEADERBOARD}?${params.toString()}`,
            RequestMethod.GET,
            HEADERS(token).AUTH,
        );
        return boardFromData(response.data as BoardData);
    },

    /** Join the board, or change the name. The server refuses a name it will not allow with a reason. */
    async join(displayName: string, token: string): Promise<string> {
        const response = await networkRequest(
            URL_EXT.LEADERBOARD_PROFILE,
            RequestMethod.PUT,
            { ...HEADERS().JSON, ...HEADERS(token).AUTH },
            JSON.stringify({ display_name: displayName }),
        );
        return response.data.display_name as string;
    },

    /** Leave the board. The server also deletes the user's entries and snapshots. */
    async leave(token: string): Promise<void> {
        await networkRequest(URL_EXT.LEADERBOARD_PROFILE, RequestMethod.DELETE, HEADERS(token).AUTH);
    },
};
