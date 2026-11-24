import { describeSignal } from "@/features/sharing/SharedStrategy";
import { EXIT_RULE_LABELS, EXIT_RULE_NAMES, ExitRules, exitRulesToJSON } from "./classes/ExitRules";
import { Signal } from "./classes/Signal";
import { Strategy } from "./classes/Strategy";
import { Trade } from "./classes/Trade";

export const MAX_TITLE_LENGTH = 50; // what the server accepts

/** What the edit screen holds: the parts of a strategy that may be changed. The market and the interval may not. */
export interface EditedFields {
    title: string;
    buySignals: Signal[];
    sellSignals: Signal[];
    exitRules: ExitRules;
}

/** The fields an edit starts from: copies of the strategy's own, so editing them cannot change the strategy on screen. */
export function startingFields(strategy: Strategy): EditedFields {
    return {
        title: strategy.title,
        buySignals: strategy.buySignals.map((signal) => signal.clone()),
        sellSignals: strategy.sellSignals.map((signal) => signal.clone()),
        exitRules: { ...strategy.exitRules },
    };
}

/**
 * A signal as the server compares them: what it does, not which version of the indicator or where it sits in the list.
 * Signals are all required at once, so the same set in another order is the same rules.
 */
const signalKey = (signal: Signal): string =>
    JSON.stringify([
        signal.indicator.name, signal.aboveTarget, signal.targetValue, signal.window, signal.fastWindow, signal.slowWindow,
        signal.signalWindow, signal.compareTo ? [signal.compareTo.indicator.name, signal.compareTo.window] : null,
    ]);

export function sameSignals(a: Signal[], b: Signal[]): boolean {
    const keys = (list: Signal[]) => list.map(signalKey).sort();
    return JSON.stringify(keys(a)) === JSON.stringify(keys(b));
}

const sameExitRules = (a: ExitRules, b: ExitRules): boolean =>
    EXIT_RULE_NAMES.every((name) => (a[name] ?? null) === (b[name] ?? null));

export interface EditSummaryLine {
    label: string;
    from: string;
    to: string;
}

export interface EditSummary {
    titleChanged: boolean;
    /** The signals or the exit rules changed. This is what restarts a tracked strategy's leaderboard standing. */
    rulesChanged: boolean;
    lines: EditSummaryLine[];
}

const rulesText = (signals: Signal[]): string => (signals.length > 0 ? signals.map(describeSignal).join("; ") : "None");
const exitText = (percent: number | undefined): string => (percent === undefined ? "Off" : `${percent}%`);

/** What an edit would change, in words, from the strategy as it is to the fields as edited. Empty lines mean nothing changed. */
export function summarizeEdit(original: Strategy, edited: EditedFields): EditSummary {
    const lines: EditSummaryLine[] = [];
    const titleChanged = edited.title.trim() !== original.title;
    if (titleChanged) lines.push({ label: "Name", from: original.title, to: edited.title.trim() });

    let rulesChanged = false;
    if (!sameSignals(original.buySignals, edited.buySignals)) {
        rulesChanged = true;
        lines.push({ label: "Buy when", from: rulesText(original.buySignals), to: rulesText(edited.buySignals) });
    }
    if (!sameSignals(original.sellSignals, edited.sellSignals)) {
        rulesChanged = true;
        lines.push({ label: "Sell when", from: rulesText(original.sellSignals), to: rulesText(edited.sellSignals) });
    }
    for (const name of EXIT_RULE_NAMES) {
        if ((original.exitRules[name] ?? null) !== (edited.exitRules[name] ?? null)) {
            rulesChanged = true;
            lines.push({ label: EXIT_RULE_LABELS[name], from: exitText(original.exitRules[name]), to: exitText(edited.exitRules[name]) });
        }
    }
    return { titleChanged, rulesChanged, lines };
}

/** Why the edited fields cannot be saved, or null if they can. The server checks the same things. */
export function validateEdit(edited: EditedFields): string | null {
    const title = edited.title.trim();
    if (title.length === 0) return "Please give the strategy a name";
    if (title.length > MAX_TITLE_LENGTH) return `The name can be at most ${MAX_TITLE_LENGTH} characters`;
    if (edited.buySignals.length === 0) return "A strategy needs at least one buy signal";
    return null;
}

/**
 * The PATCH body: only the parts that changed, so an edit that changes the name alone cannot touch the rules. Null when
 * nothing changed. Signals are sent in the version the strategy already uses (the server accepts one per strategy).
 */
export function buildEditBody(original: Strategy, edited: EditedFields): string | null {
    const body: Record<string, unknown> = {};
    if (edited.title.trim() !== original.title) body.title = edited.title.trim();

    if (!sameSignals(original.buySignals, edited.buySignals) || !sameSignals(original.sellSignals, edited.sellSignals)) {
        const version = original.signalVersion();
        body.signals = [
            ...edited.buySignals.map((signal) => signal.toJSON(true, version)),
            ...edited.sellSignals.map((signal) => signal.toJSON(false, version)),
        ];
    }
    if (!sameExitRules(original.exitRules, edited.exitRules)) body.exit_rules = exitRulesToJSON(edited.exitRules);

    return Object.keys(body).length > 0 ? JSON.stringify(body) : null;
}

export type EditedPart = "buy_signals" | "sell_signals" | "exit_rules";

/** One recorded edit of a tracked strategy's rules: when, and which parts changed. */
export interface EditRecord {
    date: Date;
    changed: EditedPart[];
}

const PARTS: EditedPart[] = ["buy_signals", "sell_signals", "exit_rules"];

/**
 * Reads the edit record from the server (`{date, changes: {part: {from, to}}}`) or from the stored copy
 * (`{date, changed: [part]}`). Anything that is not a dated record is dropped; the result is in time order.
 */
export function editsFromData(data: unknown): EditRecord[] {
    if (!Array.isArray(data)) return [];
    const records: EditRecord[] = [];
    for (const item of data) {
        const date = new Date((item as { date?: unknown })?.date as string);
        if (Number.isNaN(date.getTime())) continue;
        const raw = item as { changes?: unknown; changed?: unknown };
        const named = Array.isArray(raw.changed)
            ? (raw.changed as unknown[])
            : raw.changes && typeof raw.changes === "object" ? Object.keys(raw.changes) : [];
        records.push({ date, changed: PARTS.filter((part) => named.includes(part)) });
    }
    return records.sort((a, b) => a.date.getTime() - b.date.getTime());
}

const PART_WORDS: Record<EditedPart, string> = { buy_signals: "buy rules", sell_signals: "sell rules", exit_rules: "exit rules" };

/** "Changed the buy rules and the exit rules". */
export function describeEditRecord(record: EditRecord): string {
    const words = record.changed.map((part) => `the ${PART_WORDS[part]}`);
    if (words.length === 0) return "Changed the rules";
    return `Changed ${words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}` : words[0]}`;
}

export type TradeListRow =
    | { kind: "trade"; trade: Trade; index: number }
    | { kind: "edit"; edit: EditRecord };

/** The trades in order with a marker row where the rules changed, so trades before and after an edit can be told apart. */
export function tradeRows(trades: Trade[], edits: EditRecord[]): TradeListRow[] {
    const rows: TradeListRow[] = [];
    let next = 0;
    trades.forEach((trade, index) => {
        while (next < edits.length && edits[next].date.getTime() <= trade.date.getTime()) {
            rows.push({ kind: "edit", edit: edits[next++] });
        }
        rows.push({ kind: "trade", trade, index });
    });
    // An edit after the last trade still shows, so the list ends with what changed most recently.
    while (next < edits.length) rows.push({ kind: "edit", edit: edits[next++] });
    return rows;
}
