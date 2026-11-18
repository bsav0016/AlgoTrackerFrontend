import { Strategy, StrategyData } from "./classes/Strategy";
import { Trade } from "./classes/Trade";
import { makeScalesFor } from "./chart/chartMath";
import { curveFromData, curveGlyphs, curveReadout, curveSeries, heldValueAt } from "./liveCurve";

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.UTC(2026, 0, 1) + days * DAY).toISOString();

describe("curveFromData", () => {
  it("reads dates and multiples, in time order", () => {
    const curve = curveFromData([
      { date: at(5), multiple: 1.1 }, { date: at(1), multiple: 1.0 }, { date: at(9), multiple: 0.99 },
    ]);
    expect(curve.map((p) => p.multiple)).toEqual([1.0, 1.1, 0.99]);
    expect(curve[0].date.toISOString()).toBe(at(1));
  });

  it("is empty when an older server sent none, or sent something that is not a list", () => {
    for (const none of [undefined, null, "x", 5, {}]) expect(curveFromData(none)).toEqual([]);
  });

  it("drops points that are not a real date and a positive number", () => {
    const curve = curveFromData([
      { date: "not a date", multiple: 1 }, { date: at(1), multiple: "1.1" }, { date: at(2), multiple: NaN },
      { date: at(3), multiple: -1 }, { date: at(4), multiple: 0 }, null, { date: at(5), multiple: 1.2 },
    ]);
    expect(curve.map((p) => p.multiple)).toEqual([1.2]);
  });
});

describe("curveSeries", () => {
  const curve = curveFromData([{ date: at(0), multiple: 1.0 }, { date: at(10), multiple: 1.1 }, { date: at(20), multiple: 0.99 }]);

  it("holds the value flat and then steps, in percent since the first buy", () => {
    const series = curveSeries(curve);
    expect(series.map((p) => [p.time / DAY - Date.UTC(2026, 0, 1) / DAY, Math.round(p.value * 100) / 100])).toEqual([
      [0, 0], [10, 0], [10, 10], [20, 10], [20, -1],
    ]);
    expect(series.every((p) => p.price === p.value)).toBe(true);
  });

  it("has nothing to draw with fewer than two points", () => {
    expect(curveSeries([])).toEqual([]);
    expect(curveSeries(curve.slice(0, 1))).toEqual([]);
  });
});

describe("heldValueAt", () => {
  const series = curveSeries(curveFromData([{ date: at(0), multiple: 1.0 }, { date: at(10), multiple: 1.1 }]));
  const day = (n: number) => Date.UTC(2026, 0, 1) + n * DAY;

  it("is the last value at or before the time, and null before the curve starts", () => {
    expect(heldValueAt(series, day(-1))).toBeNull();
    expect(heldValueAt(series, day(0))).toBe(0);
    expect(heldValueAt(series, day(5))).toBe(0);
    expect(heldValueAt(series, day(10))).toBeCloseTo(10); // the closing value, after the step
    expect(heldValueAt(series, day(99))).toBeCloseTo(10);
  });
});

describe("curveGlyphs", () => {
  const curve = curveFromData([{ date: at(0), multiple: 1.0 }, { date: at(10), multiple: 1.1 }, { date: at(20), multiple: 1.1 }]);
  const series = curveSeries(curve);
  const day = (n: number) => Date.UTC(2026, 0, 1) + n * DAY;
  const scales = makeScalesFor({ timeStart: day(0), timeEnd: day(20), low: 0, high: 10 }, 300, 200, { left: 10, right: 10, top: 10, bottom: 10 });

  it("puts a mark for each trade on the curve, telling a buy, a sell and an exit-rule sale apart", () => {
    const trades = [
      new Trade(new Date(day(0)), 100, true),
      new Trade(new Date(day(10)), 110, false),
      new Trade(new Date(day(15)), 110, true),
      new Trade(new Date(day(20)), 99, false, "stop_loss"),
    ];
    const glyphs = curveGlyphs(trades, series, scales);
    expect(glyphs.map((g) => g.kind)).toEqual(["buy", "sell", "buy", "exit"]);
    expect(glyphs[0].y).toBeCloseTo(scales.y(0));
    expect(glyphs[1].y).toBeCloseTo(scales.y(10)); // a closing sale sits at the new value
    expect(glyphs[2].y).toBeCloseTo(scales.y(10)); // the next buy is on the flat part
    expect(glyphs[0].x).toBeCloseTo(scales.x(day(0)));
  });

  it("leaves out a trade the curve does not reach", () => {
    const trades = [new Trade(new Date(day(-5)), 100, true), new Trade(new Date(day(99)), 100, false)];
    expect(curveGlyphs(trades, series, scales)).toEqual([]);
  });
});

describe("curveReadout", () => {
  const series = curveSeries(curveFromData([{ date: at(0), multiple: 1.0 }, { date: at(10), multiple: 1.1 }]));
  const day = (n: number) => Date.UTC(2026, 0, 1) + n * DAY;

  it("shows the latest value at rest", () => {
    expect(curveReadout(series, null)).toEqual({ time: day(10), percent: expect.closeTo(10, 6) });
  });

  it("shows the value held at a touched time, and clamps to the ends of the curve", () => {
    expect(curveReadout(series, day(4))).toEqual({ time: day(4), percent: 0 });
    expect(curveReadout(series, day(-3))?.time).toBe(day(0));
    expect(curveReadout(series, day(50))?.time).toBe(day(10));
  });

  it("has no readout for an empty curve", () => {
    expect(curveReadout([], null)).toBeNull();
    expect(curveReadout([], day(1))).toBeNull();
  });
});

describe("on a strategy", () => {
  const data = (extra: Partial<StrategyData> = {}): StrategyData => ({
    id: 3, title: "T", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [], trades: [],
    strategy_return: 1.05, asset_return: 1.02, position: 2, charge_user_date: at(30), active: true, ...extra,
  });

  it("carries the curve the server sent", () => {
    const strategy = Strategy.fromData(data({ equity_curve: [{ date: at(0), multiple: 1.0 }, { date: at(9), multiple: 1.05 }] }));
    expect(strategy.equityCurve.map((p) => p.multiple)).toEqual([1.0, 1.05]);
  });

  it("has none when an older server leaves it out", () => {
    expect(Strategy.fromData(data()).equityCurve).toEqual([]);
  });

  it("keeps it through the copy in storage, and reads a copy stored before it existed as none", () => {
    const strategy = Strategy.fromData(data({ equity_curve: [{ date: at(0), multiple: 1.0 }, { date: at(9), multiple: 1.05 }] }));
    const stored = JSON.parse(JSON.stringify(strategy));
    expect(Strategy.fromStored(stored).equityCurve.map((p) => [p.date.toISOString(), p.multiple])).toEqual([[at(0), 1.0], [at(9), 1.05]]);
    delete stored.equityCurve;
    expect(Strategy.fromStored(stored).equityCurve).toEqual([]);
  });
});
