import { Backtest, BacktestResponseDataFormat } from "../classes/Backtest";
import { Signal } from "../classes/Signal";
import { Strategy } from "../classes/Strategy";
import { Trade } from "../classes/Trade";
import { IndicatorName, indicators } from "../enums/Indicator";
import {
    MAX_DRAWN_POINTS, SeriesPoint, formatDay, formatMonth, formatPercent, formatPercentTick, formatTick, glyphPath,
    linePath, makeScales, nearestIndex, niceTicks, percentSeries, reduceSeries, tradeGlyphs, tradeMarkers, valueAt,
} from "./chartMath";

const DAY = 86_400_000;
const series = (prices: number[], values: number[] = prices): SeriesPoint[] =>
  prices.map((price, i) => ({ time: i * DAY, price, value: values[i] }));

describe("reduceSeries", () => {
  it("leaves a short series alone", () => {
    const points = series([1, 2, 3, 4]);
    expect(reduceSeries(points, 10)).toBe(points);
  });

  it("thins a long series, keeps the ends and the order", () => {
    const points = series(Array.from({ length: 5000 }, (_, i) => 100 + Math.sin(i / 50) * 10));
    const reduced = reduceSeries(points);
    expect(reduced.length).toBeLessThanOrEqual(MAX_DRAWN_POINTS * 1.2);
    expect(reduced.length).toBeGreaterThan(MAX_DRAWN_POINTS / 3);
    expect(reduced[0]).toBe(points[0]);
    expect(reduced[reduced.length - 1]).toBe(points[points.length - 1]);
    const times = reduced.map((p) => p.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it("never averages away a spike or a dip in either line", () => {
    const prices = Array.from({ length: 5000 }, () => 100);
    const values = Array.from({ length: 5000 }, () => 100);
    prices[2503] = 400;
    values[777] = -50;
    const reduced = reduceSeries(series(prices, values));
    expect(Math.max(...reduced.map((p) => p.price))).toBe(400);
    expect(Math.min(...reduced.map((p) => p.value))).toBe(-50);
  });
});

describe("niceTicks", () => {
  it("picks round numbers inside the range", () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(243, 357, 5)).toEqual([260, 280, 300, 320, 340]);
    expect(niceTicks(0.1, 0.4, 4)).toEqual([0.1, 0.2, 0.3, 0.4]);
  });

  it("copes with a flat or broken range", () => {
    expect(niceTicks(5, 5)).toEqual([5]);
    expect(niceTicks(NaN, 5)).toEqual([]);
  });
});

describe("labels", () => {
  it("writes months in UTC", () => {
    expect(formatMonth(Date.UTC(2025, 10, 17))).toBe("Nov 25");
    expect(formatMonth(Date.UTC(2026, 0, 1))).toBe("Jan 26");
  });

  it("writes price ticks by size", () => {
    expect(formatTick(65432)).toBe("65,432");
    expect(formatTick(340)).toBe("340");
    expect(formatTick(42.5)).toBe("42.5");
    expect(formatTick(1.234)).toBe("1.23");
  });
});

describe("scales and paths", () => {
  const padding = { left: 10, right: 10, top: 10, bottom: 10 };
  const points = series([100, 200], [100, 150]);

  it("maps the first and last time to the plot edges and keeps higher prices higher up", () => {
    const scales = makeScales(points, 120, 110, padding);
    expect(scales.x(points[0].time)).toBeCloseTo(10);
    expect(scales.x(points[1].time)).toBeCloseTo(110);
    expect(scales.y(200)).toBeLessThan(scales.y(100));
    expect(scales.y(200)).toBeGreaterThanOrEqual(10);
    expect(scales.y(100)).toBeLessThanOrEqual(100);
  });

  it("covers the strategy line as well as the asset", () => {
    const scales = makeScales(series([100, 100], [100, 300]), 120, 110, padding);
    expect(scales.y(300)).toBeGreaterThanOrEqual(10);
  });

  it("builds a path with one move and then lines", () => {
    const scales = makeScales(points, 120, 110, padding);
    const path = linePath(points, scales, (p) => p.price);
    expect(path).toMatch(/^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+$/);
  });

  it("survives an empty or single-point series", () => {
    expect(() => makeScales([], 100, 100, padding)).not.toThrow();
    const scales = makeScales(series([5]), 100, 100, padding);
    expect(Number.isFinite(scales.x(0))).toBe(true);
    expect(Number.isFinite(scales.y(5))).toBe(true);
  });
});

describe("tradeMarkers", () => {
  it("tells a buy, a signal sell and a rule exit apart and drops trades outside the chart", () => {
    const trades = [
      new Trade(new Date(1 * DAY), 10, true),
      new Trade(new Date(2 * DAY), 11, false),
      new Trade(new Date(3 * DAY), 9, false, "stop_loss"),
      new Trade(new Date(99 * DAY), 9, true),
    ];
    expect(tradeMarkers(trades, 0, 5 * DAY).map((m) => m.kind)).toEqual(["buy", "sell", "exit"]);
  });
});

describe("percentSeries", () => {
  it("starts both lines at zero and measures change since the first candle", () => {
    const result = percentSeries(series([200, 220, 180], [200, 210, 240]));
    [0, 10, -10].forEach((expected, i) => expect(result[i].price).toBeCloseTo(expected));
    [0, 5, 20].forEach((expected, i) => expect(result[i].value).toBeCloseTo(expected));
    expect(result.map((p) => p.time)).toEqual([0, DAY, 2 * DAY]);
  });

  it("copes with an empty series and a zero first price", () => {
    expect(percentSeries([])).toEqual([]);
    expect(percentSeries(series([0, 5], [0, 5])).map((p) => [p.price, p.value])).toEqual([[0, 0], [0, 0]]);
  });
});

describe("percent labels", () => {
  it("writes a sign, one decimal, and no negative zero", () => {
    expect(formatPercent(23.92)).toBe("+23.9%");
    expect(formatPercent(-4.94)).toBe("-4.9%");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(-0.01)).toBe("0.0%");
  });

  it("writes axis ticks as whole numbers when it can", () => {
    expect(formatPercentTick(20)).toBe("+20%");
    expect(formatPercentTick(-10)).toBe("-10%");
    expect(formatPercentTick(0)).toBe("0%");
    expect(formatPercentTick(2.5)).toBe("+2.5%");
  });

  it("writes a full date in UTC", () => {
    expect(formatDay(Date.UTC(2025, 10, 7))).toBe("Nov 7, 2025");
  });
});

describe("reading the chart by touch", () => {
  const points = series([0, 1, 2, 3], [0, 10, 20, 30]);

  it("finds the point nearest a time, and clamps outside the series", () => {
    expect(nearestIndex(points, 0)).toBe(0);
    expect(nearestIndex(points, 1.4 * DAY)).toBe(1);
    expect(nearestIndex(points, 1.6 * DAY)).toBe(2);
    expect(nearestIndex(points, -5 * DAY)).toBe(0);
    expect(nearestIndex(points, 99 * DAY)).toBe(3);
    expect(nearestIndex([], 0)).toBe(-1);
  });

  it("reads the value along the line between two points", () => {
    expect(valueAt(points, 1.5 * DAY)).toBeCloseTo(15);
    expect(valueAt(points, 1 * DAY)).toBeCloseTo(10);
    expect(valueAt(points, 3 * DAY)).toBeCloseTo(30);
    expect(valueAt([], 0)).toBe(0);
  });

  it("places a glyph for each trade on the strategy line", () => {
    const scales = makeScales(points, 120, 110, { left: 10, right: 10, top: 10, bottom: 10 });
    const trades = [new Trade(new Date(1.5 * DAY), 10, true), new Trade(new Date(2 * DAY), 11, false, "stop_loss")];
    const glyphs = tradeGlyphs(trades, points, scales);
    expect(glyphs.map((g) => g.kind)).toEqual(["buy", "exit"]);
    expect(glyphs[0].x).toBeCloseTo(scales.x(1.5 * DAY));
    expect(glyphs[0].y).toBeCloseTo(scales.y(15));
    expect(glyphs[1].y).toBeCloseTo(scales.y(20));
  });

  it("draws a different closed shape for each kind", () => {
    const shapes = (["buy", "sell", "exit"] as const).map((kind) => glyphPath(kind, 50, 50));
    expect(new Set(shapes).size).toBe(3);
    shapes.forEach((shape) => expect(shape).toMatch(/^M[\d.]+ [\d.]+( L[\d.]+ [\d.]+)+ Z$/));
  });
});

describe("a backtest drawn on the device", () => {
  const rsi = new Signal(indicators.find((i) => i.name === IndicatorName.rsi)!, 30, false, 14, null, null, null);
  const backtest = () => new Backtest(new Strategy(-1, "", "AAPL", "1day", [rsi], []), new Date("2024-01-01"), new Date("2024-02-01"));
  const response = (rows: { datetime: string; close: number; owned: number; return: number }[]) => ({
    result: rows.map((r) => ({ ...r, buy: false, sell: false, exit_reason: "" })),
    percent_return: 0, percent_return_adj: 0, sharpe_ratio: 0, sharpe_ratio_adj: 0, sortino_ratio: 0,
    sortino_ratio_adj: 0, user_account_credits: 0, user_monthly_credits: 0,
  }) as BacktestResponseDataFormat;

  it("asks the server not to draw the images", () => {
    expect(JSON.parse(backtest().toRequestJSON()).include_images).toBe(false);
  });

  it("builds chart points from the rows it was sent, with no images", () => {
    const result = backtest().updateFromData(response([
      { datetime: "2024-01-01T00:00:00Z", close: 10, owned: 0, return: 10 },
      { datetime: "2024-01-02T00:00:00Z", close: 11, owned: 1, return: 10 },
      { datetime: "2024-01-03T00:00:00Z", close: 12, owned: 1, return: 10.9 },
    ]));
    expect(result.resultImage).toBeNull();
    expect(result.resultImageNoSignals).toBeNull();
    expect(result.chartPoints()).toEqual([
      { time: Date.parse("2024-01-01T00:00:00Z"), price: 10, value: 10 },
      { time: Date.parse("2024-01-02T00:00:00Z"), price: 11, value: 10 },
      { time: Date.parse("2024-01-03T00:00:00Z"), price: 12, value: 10.9 },
    ]);
  });

  it("has no points before a result arrives", () => {
    expect(backtest().chartPoints()).toEqual([]);
  });
});
