import { Glyph, Scales, SeriesPoint } from "./chart/chartMath";
import { Trade } from "./classes/Trade";

/** One point of a tracked strategy's curve, as the server sends it (see `equity_curve` in AlgoTrackerBackend). */
export interface EquityPointData {
    date: string;
    multiple: number;
}

export interface EquityPoint {
    date: Date;
    multiple: number;
}

/**
 * Reads the curve from the server or from storage. Older servers send none, and anything that is not a dated, finite,
 * positive number is dropped rather than trusted. The server sends it in order; this keeps it that way.
 */
export function curveFromData(data: unknown): EquityPoint[] {
    if (!Array.isArray(data)) return [];
    const points: EquityPoint[] = [];
    for (const item of data) {
        const date = new Date((item as { date?: unknown })?.date as string);
        const multiple = (item as { multiple?: unknown })?.multiple;
        if (!Number.isNaN(date.getTime()) && typeof multiple === "number" && Number.isFinite(multiple) && multiple > 0) {
            points.push({ date, multiple });
        }
    }
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * The curve as a line to draw, in percent change since the first buy. The strategy's value only changes when a trade
 * closes, so between two points it is held flat and then steps: each point after the first is drawn twice, once at
 * the old value and once at the new one. A curve with fewer than two points has nothing to draw.
 */
export function curveSeries(curve: EquityPoint[]): SeriesPoint[] {
    if (curve.length < 2) return [];
    const series: SeriesPoint[] = [];
    curve.forEach((point, index) => {
        const percent = (point.multiple - 1) * 100;
        const time = point.date.getTime();
        if (index > 0) {
            const before = (curve[index - 1].multiple - 1) * 100;
            series.push({ time, price: before, value: before });
        }
        series.push({ time, price: percent, value: percent });
    });
    return series;
}

/** The value the curve holds at `time`: its last point at or before it. Null before the curve starts. */
export function heldValueAt(series: SeriesPoint[], time: number): number | null {
    let held: number | null = null;
    for (const point of series) {
        if (point.time > time) break;
        held = point.value;
    }
    return held;
}

/** Where to draw a mark for each trade: on the curve, at the trade's time. Trades the curve does not reach are skipped. */
export function curveGlyphs(trades: Trade[], series: SeriesPoint[], scales: Scales): Glyph[] {
    const glyphs: Glyph[] = [];
    for (const trade of trades) {
        const time = trade.date.getTime();
        if (time < scales.timeStart || time > scales.timeEnd) continue;
        const value = heldValueAt(series, time);
        if (value === null) continue;
        glyphs.push({
            x: scales.x(time),
            y: scales.y(value),
            kind: trade.isBuy ? "buy" : trade.exitReason ? "exit" : "sell",
        });
    }
    return glyphs;
}

/** What the readout shows: the value at a touched time, or the latest value at rest. */
export function curveReadout(series: SeriesPoint[], time: number | null): { time: number; percent: number } | null {
    if (series.length === 0) return null;
    const last = series[series.length - 1];
    if (time === null) return { time: last.time, percent: last.value };
    const clamped = Math.min(Math.max(time, series[0].time), last.time);
    return { time: clamped, percent: heldValueAt(series, clamped) ?? series[0].value };
}
