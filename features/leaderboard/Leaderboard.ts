export type BoardKind = "week" | "all_time";
export type BoardGroup = "daily_or_longer" | "intraday";

export const GROUP_LABELS: Record<BoardGroup, string> = {
    daily_or_longer: "Daily and longer",
    intraday: "Intraday",
};

/** The rules, in the words shown on the screen. They mirror the backend's (api/leaderboard_rules.py). */
export const RULES_TEXT =
    "Ranked by return over buy-and-hold: 10% means the strategy beat simply holding the asset by 10%. Only live " +
    "results count, never backtests. A strategy ranks after 14 days live and 3 completed trades, within its group, " +
    "and each person shows once per group with their best strategy.";

export interface BoardEntry {
    rank: number;
    displayName: string;
    score: number;
    strategyReturn: number;
    assetReturn: number;
    isMe: boolean;
}

export interface BoardPlace {
    rank: number;
    score: number;
    strategyReturn: number;
    assetReturn: number;
}

export interface Board {
    kind: BoardKind;
    group: BoardGroup;
    periodStart: string | null;
    total: number;
    entries: BoardEntry[];
    onBoard: boolean;
    me: BoardPlace | null;
    weeks: string[];
}

export interface BoardData {
    kind: BoardKind;
    group: BoardGroup;
    period_start: string | null;
    total: number;
    entries: {
        rank: number;
        display_name: string;
        score: number;
        strategy_return: number;
        asset_return: number;
        is_me: boolean;
    }[];
    on_board: boolean;
    me: { rank: number; score: number; strategy_return: number; asset_return: number } | null;
    weeks?: string[];
}

export function boardFromData(data: BoardData): Board {
    return {
        kind: data.kind,
        group: data.group,
        periodStart: data.period_start,
        total: data.total,
        entries: data.entries.map((e) => ({
            rank: e.rank,
            displayName: e.display_name,
            score: e.score,
            strategyReturn: e.strategy_return,
            assetReturn: e.asset_return,
            isMe: e.is_me,
        })),
        onBoard: data.on_board,
        me: data.me
            ? { rank: data.me.rank, score: data.me.score, strategyReturn: data.me.strategy_return, assetReturn: data.me.asset_return }
            : null,
        weeks: data.weeks ?? [],
    };
}

/** A score is a ratio (1.10 beat buy-and-hold by 10%); shown as a signed percentage, e.g. "+10.0%". */
export function formatEdge(score: number): string {
    const percent = (score - 1) * 100;
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

/** "Week of Sep 7" from the board's Monday (YYYY-MM-DD), read as the UTC date it is. */
export function formatWeek(periodStart: string): string {
    const date = new Date(`${periodStart}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return periodStart;
    return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

// The same limits the server enforces, so the user hears about a bad name before sending it. The server decides.
export const NAME_MIN = 3;
export const NAME_MAX = 20;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;

/** A message if the name cannot be used, or null if it looks fine. */
export function nameProblem(raw: string): string | null {
    const name = raw.trim().replace(/\s+/g, " ");
    if (name.length < NAME_MIN || name.length > NAME_MAX) return `Use ${NAME_MIN} to ${NAME_MAX} characters`;
    if (!NAME_PATTERN.test(name)) return "Use only letters, numbers, spaces, hyphens and underscores";
    return null;
}

/** The server's reason for refusing a name (`{"display_name": ["..."]}`), if that is what an error carries. */
export function serverNameProblem(details: unknown): string | null {
    const messages = (details as { display_name?: unknown } | null)?.display_name;
    return Array.isArray(messages) && typeof messages[0] === "string" ? messages[0] : null;
}

/** The week before or after `current` in a newest-first list of published weeks, or null at either end. */
export function neighbourWeek(weeks: string[], current: string | null, direction: "older" | "newer"): string | null {
    const index = current ? weeks.indexOf(current) : -1;
    if (index === -1) return null;
    const target = direction === "older" ? index + 1 : index - 1;
    return weeks[target] ?? null;
}
