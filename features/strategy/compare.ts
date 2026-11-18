import { describeSignal } from "@/features/sharing/SharedStrategy";
import { Backtest } from "./classes/Backtest";
import { EXIT_RULE_LABELS, EXIT_RULE_NAMES } from "./classes/ExitRules";
import { SeriesPoint, formatDay, formatPercent, percentSeries, readAt } from "./chart/chartMath";
import { formatBuysAndSells } from "./plainWords";

/**
 * Two saved runs, ready to draw on one chart. Both are percent change since their own first candle.
 *
 * - "calendar": the same market and the same covered period, so the dates line up and the asset's own line can be
 *   drawn once for both.
 * - "elapsed": anything else (another symbol, interval or period). Putting two different dates on one axis would
 *   mislead, so each run starts at day 0 and the asset line is left out.
 */
export interface ComparePlan {
    mode: "calendar" | "elapsed";
    runA: SeriesPoint[];
    runB: SeriesPoint[];
    /** Whether `runA`'s `price` (the asset) is drawn as the line both runs are measured against. */
    showAsset: boolean;
}

export function sameMarketAndPeriod(a: Backtest, b: Backtest): boolean {
    return a.strategy.symbol === b.strategy.symbol
        && a.strategy.interval === b.strategy.interval
        && a.dataWindow !== null && b.dataWindow !== null
        && a.dataWindow.covered_start === b.dataWindow.covered_start
        && a.dataWindow.covered_end === b.dataWindow.covered_end;
}

const fromFirstCandle = (points: SeriesPoint[]): SeriesPoint[] =>
    points.map((point) => ({ ...point, time: point.time - points[0].time }));

export function planCompare(a: Backtest, b: Backtest): ComparePlan {
    const runA = percentSeries(a.chartPoints());
    const runB = percentSeries(b.chartPoints());
    if (sameMarketAndPeriod(a, b)) return { mode: "calendar", runA, runB, showAsset: true };
    return { mode: "elapsed", runA: fromFirstCandle(runA), runB: fromFirstCandle(runB), showAsset: false };
}

export interface Readout {
    a: number | null;
    b: number | null;
    asset: number | null;
}

/**
 * The numbers to show for the chart. At rest (`time` is null) each run shows its own final value, even when one run
 * is shorter than the other; while a finger is on the chart they are read at that time, and a run that does not
 * reach it shows nothing.
 */
export function readoutAt(plan: ComparePlan, time: number | null): Readout {
    const last = (points: SeriesPoint[]) => (points.length ? points[points.length - 1] : null);
    if (time === null) {
        return { a: last(plan.runA)?.value ?? null, b: last(plan.runB)?.value ?? null, asset: plan.showAsset ? last(plan.runA)?.price ?? null : null };
    }
    return {
        a: readAt(plan.runA, time, (p) => p.value),
        b: readAt(plan.runB, time, (p) => p.value),
        asset: plan.showAsset ? readAt(plan.runA, time, (p) => p.price) : null,
    };
}

export type CompareKind = "percent" | "ratio" | "count";

export interface CompareRow {
    label: string;
    kind: CompareKind;
    a: number | null;
    b: number | null;
}

/** The numbers shown side by side. Differences are always B minus A. */
export function compareRows(a: Backtest, b: Backtest): CompareRow[] {
    const row = (label: string, kind: CompareKind, pick: (run: Backtest) => number | null): CompareRow =>
        ({ label, kind, a: pick(a), b: pick(b) });
    return [
        row("Gain over period", "percent", (run) => run.periodReturn),
        row("Before costs", "percent", (run) => run.periodReturnBeforeCosts),
        row("Versus holding", "percent", (run) => run.periodReturnAdj),
        row("Gain per year", "percent", (run) => run.percentReturn),
        row("Sharpe ratio", "ratio", (run) => run.sharpeRatio),
        row("Sortino ratio", "ratio", (run) => run.sortinoRatio),
        row("Buys and sells", "count", (run) => run.tradeCount),
    ];
}

export function formatCell(kind: CompareKind, value: number | null): string {
    if (value === null || !Number.isFinite(value)) return "-";
    if (kind === "percent") return formatPercent(value);
    if (kind === "count") return String(Math.round(value));
    return value.toFixed(2);
}

/** B minus A, with a sign; percent gains differ in percentage points. Null when either is missing. */
export function formatDifference(row: CompareRow): string | null {
    if (row.a === null || row.b === null || !Number.isFinite(row.a) || !Number.isFinite(row.b)) return null;
    const difference = row.b - row.a;
    if (row.kind === "count") return `${difference > 0 ? "+" : ""}${Math.round(difference)}`;
    const small = Math.abs(difference) < (row.kind === "percent" ? 0.05 : 0.005);
    const text = small ? (row.kind === "percent" ? "0.0" : "0.00") : difference.toFixed(row.kind === "percent" ? 1 : 2);
    return `${difference > 0 && !small ? "+" : ""}${text}${row.kind === "percent" ? " pts" : ""}`;
}

/** Whether the difference is good news for B: for gains, ratios and versus-holding a higher B is better. Trades are neutral. */
export function differenceTone(row: CompareRow): "gain" | "loss" | "neutral" {
    if (row.kind === "count" || row.a === null || row.b === null) return "neutral";
    const difference = row.b - row.a;
    if (Math.abs(difference) < 1e-9) return "neutral";
    return difference > 0 ? "gain" : "loss";
}

export interface Difference {
    label: string;
    a: string;
    b: string;
}

const market = (run: Backtest) => `${run.strategy.symbol} · ${run.strategy.interval}`;
const period = (run: Backtest) =>
    run.dataWindow ? `${formatDay(Date.parse(run.dataWindow.covered_start))} to ${formatDay(Date.parse(run.dataWindow.covered_end))}` : "";
const rules = (run: Backtest, side: "buy" | "sell") =>
    (side === "buy" ? run.strategy.buySignals : run.strategy.sellSignals).map(describeSignal).join("; ");

/** What the two runs did differently, in words; only the things that differ. Empty when the settings are the same. */
export function describeDifferences(a: Backtest, b: Backtest): Difference[] {
    const differences: Difference[] = [];
    const check = (label: string, left: string, right: string) => {
        if (left !== right) differences.push({ label, a: left || "None", b: right || "None" });
    };
    check("Market", market(a), market(b));
    check("Period", period(a), period(b));
    check("Buy when", rules(a, "buy"), rules(b, "buy"));
    check("Sell when", rules(a, "sell"), rules(b, "sell"));
    for (const name of EXIT_RULE_NAMES) {
        const left = a.strategy.exitRules[name], right = b.strategy.exitRules[name];
        if (left !== right) {
            differences.push({
                label: EXIT_RULE_LABELS[name],
                a: left === undefined ? "Off" : `${left}%`,
                b: right === undefined ? "Off" : `${right}%`,
            });
        }
    }
    return differences;
}

/** What to call a run: the name it was given, or its market. */
export function runTitle(run: Backtest): string {
    return run.label.trim() !== "" ? run.label : market(run);
}

/** The run's headline numbers, so two runs with the same name can still be told apart: "+10.3% · 11 buys and sells". */
export function runSummary(run: Backtest): string {
    const parts = [
        run.periodReturn !== null ? formatPercent(run.periodReturn) : null,
        run.tradeCount !== null ? formatBuysAndSells(run.tradeCount) : null,
    ];
    return parts.filter(Boolean).join(" · ");
}

/** The line under the title: its market when it has a name, and when it was saved. */
export function runSubtitle(run: Backtest): string {
    const parts = [run.label.trim() !== "" ? market(run) : null, run.savedAt ? `saved ${formatDay(run.savedAt.getTime())}` : null];
    return parts.filter(Boolean).join(" · ");
}
