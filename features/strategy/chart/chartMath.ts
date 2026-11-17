/**
 * The arithmetic behind the backtest chart, kept free of React and SVG so it can be tested. The screen turns the
 * backtest's rows into SeriesPoints, `reduceSeries` thins them to what a phone can show, and `makeScales` and
 * `linePath` turn them into pixels.
 */
import { Trade } from "../classes/Trade";

export interface SeriesPoint {
    time: number; // milliseconds
    price: number; // the asset
    value: number; // the strategy, started at the asset's first price so the two lines compare
}

/** A backtest can return tens of thousands of candles; a phone is a few hundred pixels wide. */
export const MAX_DRAWN_POINTS = 480;

/**
 * Thins a long series to about `maxPoints` while keeping its shape: each bucket keeps its first and last point and
 * the highest and lowest of both lines, so a spike is never averaged away. Order is preserved; a short series is
 * returned as it is.
 */
export function reduceSeries(points: SeriesPoint[], maxPoints = MAX_DRAWN_POINTS): SeriesPoint[] {
    if (points.length <= maxPoints) return points;
    const buckets = Math.max(1, Math.floor(maxPoints / 6));
    const size = points.length / buckets;
    const keep = new Set<number>([0, points.length - 1]);
    for (let b = 0; b < buckets; b++) {
        const start = Math.floor(b * size);
        const end = Math.min(points.length, Math.floor((b + 1) * size));
        if (start >= end) continue;
        let priceLow = start, priceHigh = start, valueLow = start, valueHigh = start;
        for (let i = start; i < end; i++) {
            if (points[i].price < points[priceLow].price) priceLow = i;
            if (points[i].price > points[priceHigh].price) priceHigh = i;
            if (points[i].value < points[valueLow].value) valueLow = i;
            if (points[i].value > points[valueHigh].value) valueHigh = i;
        }
        [start, end - 1, priceLow, priceHigh, valueLow, valueHigh].forEach((i) => keep.add(i));
    }
    return [...keep].sort((a, b) => a - b).map((i) => points[i]);
}

/** Round-number tick values covering [min, max], about `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return Number.isFinite(min) ? [min] : [];
    const rough = (max - min) / Math.max(1, count - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / magnitude;
    const step = (normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10) * magnitude;
    const ticks: number[] = [];
    for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step) {
        ticks.push(Number(value.toFixed(10)));
    }
    return ticks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 25": month and two-digit year in UTC, so the label does not depend on the phone's time zone. */
export function formatMonth(time: number): string {
    const date = new Date(time);
    return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`;
}

/** The label for a price tick: no decimals for big numbers, two for small ones. */
export function formatTick(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1000) return Math.round(value).toLocaleString("en-US");
    if (abs >= 100) return String(Math.round(value));
    return value.toFixed(abs >= 10 ? 1 : 2);
}

export interface Padding { left: number; right: number; top: number; bottom: number }

export interface Scales {
    x: (time: number) => number;
    y: (price: number) => number;
    yTicks: number[];
    xTicks: number[];
    timeStart: number;
    timeEnd: number;
    plot: { left: number; right: number; top: number; bottom: number };
}

/** Pixel scales for a width x height drawing; the vertical range covers both lines with a little room. */
export function makeScales(points: SeriesPoint[], width: number, height: number, padding: Padding): Scales {
    const left = padding.left, right = width - padding.right, top = padding.top, bottom = height - padding.bottom;
    const timeStart = points.length ? points[0].time : 0;
    const timeEnd = points.length ? points[points.length - 1].time : 1;
    let low = Infinity, high = -Infinity;
    for (const point of points) {
        low = Math.min(low, point.price, point.value);
        high = Math.max(high, point.price, point.value);
    }
    if (!Number.isFinite(low)) { low = 0; high = 1; }
    if (high === low) { high = low + 1; }
    const room = (high - low) * 0.04;
    low -= room;
    high += room;
    const timeSpan = timeEnd - timeStart || 1;
    return {
        x: (time) => left + ((time - timeStart) / timeSpan) * (right - left),
        y: (price) => bottom - ((price - low) / (high - low)) * (bottom - top),
        yTicks: niceTicks(low, high, 5),
        xTicks: [0, 1, 2, 3].map((i) => timeStart + (timeSpan * i) / 3),
        timeStart,
        timeEnd,
        plot: { left, right, top, bottom },
    };
}

/** An SVG path through the points, using `pick` to choose which line (asset or strategy). */
export function linePath(points: SeriesPoint[], scales: Scales, pick: (point: SeriesPoint) => number): string {
    return points
        .map((point, index) => `${index === 0 ? "M" : "L"}${scales.x(point.time).toFixed(1)} ${scales.y(pick(point)).toFixed(1)}`)
        .join(" ");
}

export type MarkerKind = "buy" | "sell" | "exit";

export interface Marker { time: number; kind: MarkerKind }

/** Vertical markers for a backtest's trades: a buy, a sell on a sell signal, or a sell made by an exit rule. */
export function tradeMarkers(trades: Trade[], timeStart: number, timeEnd: number): Marker[] {
    return trades
        .map((trade): Marker => ({
            time: trade.date.getTime(),
            kind: trade.isBuy ? "buy" : trade.exitReason ? "exit" : "sell",
        }))
        .filter((marker) => marker.time >= timeStart && marker.time <= timeEnd);
}

/**
 * Both lines as the percent change since the first candle. They start together at 0 and share one axis, which
 * reads better than two price scales: the gap between them is how much the strategy beat, or trailed, holding.
 */
export function percentSeries(points: SeriesPoint[]): SeriesPoint[] {
    if (points.length === 0) return points;
    const price0 = points[0].price, value0 = points[0].value;
    return points.map((point) => ({
        time: point.time,
        price: price0 ? (point.price / price0 - 1) * 100 : 0,
        value: value0 ? (point.value / value0 - 1) * 100 : 0,
    }));
}

/** "+23.9%", "-4.9%", "0.0%". */
export function formatPercent(value: number): string {
    const rounded = Math.abs(value) < 0.05 ? 0 : value;
    return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

/** The label on the vertical axis: whole numbers where possible ("+20%"), one decimal otherwise. */
export function formatPercentTick(value: number): string {
    const whole = Math.abs(value - Math.round(value)) < 1e-9;
    const text = whole ? String(Math.round(value)) : value.toFixed(1);
    return `${value > 0 ? "+" : ""}${text}%`;
}

/** "Nov 17, 2025" in UTC. */
export function formatDay(time: number): string {
    const date = new Date(time);
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** The index of the point nearest in time to `time` (the points are in time order). */
export function nearestIndex(points: SeriesPoint[], time: number): number {
    if (points.length === 0) return -1;
    let low = 0, high = points.length - 1;
    while (low < high) {
        const middle = (low + high) >> 1;
        if (points[middle].time < time) low = middle + 1; else high = middle;
    }
    if (low > 0 && Math.abs(points[low - 1].time - time) <= Math.abs(points[low].time - time)) low -= 1;
    return low;
}

/** The strategy's value at `time`, read along the line between the two points either side of it. */
export function valueAt(points: SeriesPoint[], time: number): number {
    if (points.length === 0) return 0;
    const index = nearestIndex(points, time);
    const nearest = points[index];
    const other = time >= nearest.time ? points[index + 1] : points[index - 1];
    if (!other || other.time === nearest.time) return nearest.value;
    const share = (time - nearest.time) / (other.time - nearest.time);
    return nearest.value + (other.value - nearest.value) * share;
}

export interface Glyph { x: number; y: number; kind: MarkerKind }

/** Where to draw a small mark for each trade: on the strategy's line, at the trade's time. */
export function tradeGlyphs(trades: Trade[], points: SeriesPoint[], scales: Scales): Glyph[] {
    return tradeMarkers(trades, scales.timeStart, scales.timeEnd).map((marker) => ({
        x: scales.x(marker.time),
        y: scales.y(valueAt(points, marker.time)),
        kind: marker.kind,
    }));
}

/** The outline of a mark centred on (x, y): a triangle up for a buy, down for a sell, a diamond for an exit rule. */
export function glyphPath(kind: MarkerKind, x: number, y: number, size = 5): string {
    const f = (n: number) => n.toFixed(1);
    if (kind === "buy") return `M${f(x)} ${f(y - size)} L${f(x + size)} ${f(y + size * 0.8)} L${f(x - size)} ${f(y + size * 0.8)} Z`;
    if (kind === "sell") return `M${f(x)} ${f(y + size)} L${f(x + size)} ${f(y - size * 0.8)} L${f(x - size)} ${f(y - size * 0.8)} Z`;
    return `M${f(x)} ${f(y - size)} L${f(x + size)} ${f(y)} L${f(x)} ${f(y + size)} L${f(x - size)} ${f(y)} Z`;
}
