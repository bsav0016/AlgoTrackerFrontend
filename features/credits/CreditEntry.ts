export type CreditBucket = "account" | "monthly";

/** One row of GET /api/credits/history/, as the server sends it. */
export interface CreditEntryData {
    id: number;
    created_at: string;
    bucket: CreditBucket;
    amount: number;
    balance_after: number;
    kind: string;
    label: string;
}

export interface CreditHistoryData {
    results: CreditEntryData[];
    next_before: number | null;
}

export class CreditEntry {
    id: number;
    createdAt: Date;
    bucket: CreditBucket;
    amount: number;
    balanceAfter: number;
    kind: string;
    label: string;

    constructor(
        id: number,
        createdAt: Date,
        bucket: CreditBucket,
        amount: number,
        balanceAfter: number,
        kind: string,
        label: string
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.bucket = bucket;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.kind = kind;
        this.label = label;
    }

    static fromData(data: CreditEntryData): CreditEntry {
        return new CreditEntry(
            data.id,
            new Date(data.created_at),
            data.bucket,
            data.amount,
            data.balance_after,
            data.kind,
            data.label
        );
    }
}

export class CreditHistoryPage {
    entries: CreditEntry[];
    nextBefore: number | null;

    constructor(entries: CreditEntry[], nextBefore: number | null) {
        this.entries = entries;
        this.nextBefore = nextBefore;
    }

    static fromData(data: CreditHistoryData): CreditHistoryPage {
        return new CreditHistoryPage(data.results.map(CreditEntry.fromData), data.next_before);
    }
}

/** "+1,000" or "-3": the sign is always shown so gains and spends read at a glance. */
export function formatCreditAmount(amount: number): string {
    const digits = Math.abs(amount).toLocaleString("en-US");
    if (amount > 0) return `+${digits}`;
    if (amount < 0) return `-${digits}`;
    return digits;
}

export function bucketName(bucket: CreditBucket): string {
    return bucket === "monthly" ? "Monthly credits" : "Account credits";
}

/** Adds a newly loaded page after the ones already shown, ignoring any row that is already there. */
export function appendPage(shown: CreditEntry[], page: CreditHistoryPage): CreditEntry[] {
    const seen = new Set(shown.map((entry) => entry.id));
    return [...shown, ...page.entries.filter((entry) => !seen.has(entry.id))];
}
