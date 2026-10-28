export type NotificationKind = "buy" | "sell";

/** One row of GET /api/notifications/, as the server sends it. */
export interface NotificationEntryData {
    id: number;
    created_at: string;
    kind: NotificationKind;
    message: string;
    strategy_id: number | null;
    trade_id: number;
    price: string;
}

export interface NotificationHistoryData {
    results: NotificationEntryData[];
    next_before: number | null;
}

export class NotificationEntry {
    id: number;
    createdAt: Date;
    kind: NotificationKind;
    message: string;
    strategyId: number | null;
    tradeId: number;
    price: number;

    constructor(
        id: number,
        createdAt: Date,
        kind: NotificationKind,
        message: string,
        strategyId: number | null,
        tradeId: number,
        price: number
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.kind = kind;
        this.message = message;
        this.strategyId = strategyId;
        this.tradeId = tradeId;
        this.price = price;
    }

    static fromData(data: NotificationEntryData): NotificationEntry {
        return new NotificationEntry(
            data.id,
            new Date(data.created_at),
            data.kind,
            data.message,
            data.strategy_id,
            data.trade_id,
            Number(data.price)
        );
    }
}

export class NotificationHistoryPage {
    entries: NotificationEntry[];
    nextBefore: number | null;

    constructor(entries: NotificationEntry[], nextBefore: number | null) {
        this.entries = entries;
        this.nextBefore = nextBefore;
    }

    static fromData(data: NotificationHistoryData): NotificationHistoryPage {
        return new NotificationHistoryPage(data.results.map(NotificationEntry.fromData), data.next_before);
    }
}

/** Adds a newly loaded page after the ones already shown, ignoring any row that is already there. */
export function appendPage(shown: NotificationEntry[], page: NotificationHistoryPage): NotificationEntry[] {
    const seen = new Set(shown.map((entry) => entry.id));
    return [...shown, ...page.entries.filter((entry) => !seen.has(entry.id))];
}

/** The strategy a push or history row opens. The push `data` comes from the server as JSON, so check it. */
export function strategyIdFromData(data: unknown): number | null {
    const id = (data as { strategy_id?: unknown } | null | undefined)?.strategy_id;
    return typeof id === "number" && Number.isInteger(id) ? id : null;
}
