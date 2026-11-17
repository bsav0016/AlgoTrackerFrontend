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
