/** One row of GET /api/backtests/, as the server sends it: enough to list a saved run, no chart data. */
export interface SavedBacktestItemData {
    id: number;
    created_at: string;
    label: string;
    symbol: string;
    interval: string;
    covered_start: string;
    covered_end: string;
    period_return: number | null;
    trades: number | null;
    has_exit_rules: boolean;
}

export interface SavedBacktestPageData {
    results: SavedBacktestItemData[];
    next_before: number | null;
}

export class SavedBacktestItem {
    id: number;
    createdAt: Date;
    label: string;
    symbol: string;
    interval: string;
    coveredStart: Date;
    coveredEnd: Date;
    /** Percent gain over the period, after costs. */
    periodReturn: number | null;
    trades: number | null;
    hasExitRules: boolean;

    constructor(
        id: number, createdAt: Date, label: string, symbol: string, interval: string, coveredStart: Date,
        coveredEnd: Date, periodReturn: number | null, trades: number | null, hasExitRules: boolean
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.label = label;
        this.symbol = symbol;
        this.interval = interval;
        this.coveredStart = coveredStart;
        this.coveredEnd = coveredEnd;
        this.periodReturn = periodReturn;
        this.trades = trades;
        this.hasExitRules = hasExitRules;
    }

    /** What to call it in the list: the name the user gave it, or the market it ran on. */
    get title(): string {
        return this.label.trim() !== "" ? this.label : `${this.symbol} · ${this.interval}`;
    }

    static fromData(data: SavedBacktestItemData): SavedBacktestItem {
        return new SavedBacktestItem(
            data.id, new Date(data.created_at), data.label ?? "", data.symbol, data.interval,
            new Date(data.covered_start), new Date(data.covered_end),
            data.period_return ?? null, data.trades ?? null, Boolean(data.has_exit_rules)
        );
    }
}

export class SavedBacktestPage {
    items: SavedBacktestItem[];
    nextBefore: number | null;

    constructor(items: SavedBacktestItem[], nextBefore: number | null) {
        this.items = items;
        this.nextBefore = nextBefore;
    }

    static fromData(data: SavedBacktestPageData): SavedBacktestPage {
        return new SavedBacktestPage(data.results.map(SavedBacktestItem.fromData), data.next_before);
    }
}

/** Adds a newly loaded page after the ones already shown, ignoring any row that is already there. */
export function appendPage(shown: SavedBacktestItem[], page: SavedBacktestPage): SavedBacktestItem[] {
    const seen = new Set(shown.map((item) => item.id));
    return [...shown, ...page.items.filter((item) => !seen.has(item.id))];
}
