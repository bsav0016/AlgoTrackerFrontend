import { Backtest, SavedBacktestDetailData } from "./classes/Backtest";
import { formatElapsed, makeScalesFor, readAt } from "./chart/chartMath";
import {
    CompareRow, compareRows, describeDifferences, differenceTone, formatCell, formatDifference, planCompare, runSubtitle,
    readoutAt, runSummary, runTitle, sameMarketAndPeriod,
} from "./compare";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

const rsi = (target: number, aboveTarget: boolean) => ({
  name: "RSI", above_target: aboveTarget, target_value: target, window: 14, fast_window: null, slow_window: null,
  signal_window: null, version: 2,
});

const WINDOW = {
  requested_start: "2025-01-01T00:00:00Z", requested_end: "2025-01-05T00:00:00Z",
  covered_start: "2025-01-01T00:00:00+00:00", covered_end: "2025-01-04T00:00:00+00:00",
  candles: 4, requests: 1, truncated: false, reason: null as "request_limit" | "history_ends" | null,
};

const run = (overrides: Partial<SavedBacktestDetailData> = {}): Backtest =>
  Backtest.fromSaved({
    id: 1, label: "", created_at: "2026-11-17T12:00:00Z", symbol: "AAPL", interval: "1day",
    requested_start: "2025-01-01T00:00:00Z", requested_end: "2025-01-05T00:00:00Z",
    buy_signals: [rsi(30, false)], sell_signals: [rsi(70, true)], exit_rules: {}, next_candle_execution: false,
    percent_return: 10, percent_return_adj: 2, period_return: 5, period_return_adj: 1, period_return_before_costs: 6,
    annualized_is_extrapolated: false, trade_cost_percent: 0.1, trades: 2, sharpe_ratio: 1, sharpe_ratio_adj: 0.5,
    sortino_ratio: 2, sortino_ratio_adj: 1, data_window: WINDOW,
    result: [
      { datetime: "2025-01-01T00:00:00Z", close: 100, owned: 0, return: 100, exit_reason: "" },
      { datetime: "2025-01-02T00:00:00Z", close: 110, owned: 1, return: 100, exit_reason: "" },
      { datetime: "2025-01-03T00:00:00Z", close: 120, owned: 1, return: 109, exit_reason: "" },
      { datetime: "2025-01-04T00:00:00Z", close: 90, owned: 0, return: 105, exit_reason: "" },
    ],
    ...overrides,
  } as SavedBacktestDetailData);

describe("sameMarketAndPeriod", () => {
  it("is true only for the same symbol, interval and covered period", () => {
    expect(sameMarketAndPeriod(run(), run())).toBe(true);
    expect(sameMarketAndPeriod(run(), run({ symbol: "BTC/USD" }))).toBe(false);
    expect(sameMarketAndPeriod(run(), run({ interval: "1min" }))).toBe(false);
    expect(sameMarketAndPeriod(run(), run({ data_window: { ...WINDOW, covered_end: "2025-01-03T00:00:00+00:00" } }))).toBe(false);
  });
});

describe("planCompare", () => {
  it("keeps the dates and draws the asset once when both runs cover the same market and period", () => {
    const plan = planCompare(run(), run({ sell_signals: [rsi(80, true)] }));
    expect(plan.mode).toBe("calendar");
    expect(plan.showAsset).toBe(true);
    expect(plan.runA[0].time).toBe(Date.parse("2025-01-01T00:00:00Z"));
    expect(plan.runA.map((p) => Math.round(p.value * 10) / 10)).toEqual([0, 0, 9, 5]);
    expect(plan.runA.map((p) => Math.round(p.price))).toEqual([0, 10, 20, -10]);
  });

  it("starts both runs at day 0 and leaves the asset out when they do not match", () => {
    const later = run({
      symbol: "BTC/USD",
      data_window: { ...WINDOW, covered_start: "2025-06-01T00:00:00+00:00", covered_end: "2025-06-04T00:00:00+00:00" },
      result: [
        { datetime: "2025-06-01T00:00:00Z", close: 50, owned: 0, return: 50, exit_reason: "" },
        { datetime: "2025-06-02T00:00:00Z", close: 55, owned: 1, return: 55, exit_reason: "" },
      ],
    });
    const plan = planCompare(run(), later);
    expect(plan.mode).toBe("elapsed");
    expect(plan.showAsset).toBe(false);
    expect(plan.runA[0].time).toBe(0);
    expect(plan.runB.map((p) => p.time)).toEqual([0, 86_400_000]);
    expect(plan.runB[1].value).toBeCloseTo(10);
  });
});

describe("the numbers", () => {
  it("lists each run's figures in the same order", () => {
    const rows = compareRows(run(), run({ period_return: 8, trades: 5, sharpe_ratio: 1.5 }));
    expect(rows.map((r) => r.label)).toEqual([
      "Gain over period", "Before costs", "Versus holding", "Gain per year", "Sharpe ratio", "Sortino ratio", "Trades",
    ]);
    expect(rows[0]).toMatchObject({ kind: "percent", a: 5, b: 8 });
    expect(rows[4]).toMatchObject({ kind: "ratio", a: 1, b: 1.5 });
    expect(rows[6]).toMatchObject({ kind: "count", a: 2, b: 5 });
  });

  it("formats each kind, and a missing number as a dash", () => {
    expect(formatCell("percent", 23.92)).toBe("+23.9%");
    expect(formatCell("ratio", 1.4)).toBe("1.40");
    expect(formatCell("count", 25)).toBe("25");
    expect(formatCell("percent", null)).toBe("-");
    expect(formatCell("ratio", NaN)).toBe("-");
  });

  it("shows B minus A: percentage points for gains, plain for ratios and counts, nothing when a side is missing", () => {
    const row = (kind: CompareRow["kind"], a: number | null, b: number | null): CompareRow => ({ label: "x", kind, a, b });
    expect(formatDifference(row("percent", 8.2, 13.8))).toBe("+5.6 pts");
    expect(formatDifference(row("percent", 13.8, 8.2))).toBe("-5.6 pts");
    expect(formatDifference(row("percent", 5, 5.01))).toBe("0.0 pts");
    expect(formatDifference(row("ratio", 1, 1.5))).toBe("+0.50");
    expect(formatDifference(row("count", 25, 27))).toBe("+2");
    expect(formatDifference(row("count", 27, 25))).toBe("-2");
    expect(formatDifference(row("percent", null, 3))).toBeNull();
  });

  it("colours a better B green and a worse B red, and counts neutral", () => {
    expect(differenceTone({ label: "x", kind: "percent", a: 1, b: 2 })).toBe("gain");
    expect(differenceTone({ label: "x", kind: "ratio", a: 2, b: 1 })).toBe("loss");
    expect(differenceTone({ label: "x", kind: "percent", a: 1, b: 1 })).toBe("neutral");
    expect(differenceTone({ label: "x", kind: "count", a: 1, b: 9 })).toBe("neutral");
    expect(differenceTone({ label: "x", kind: "percent", a: null, b: 9 })).toBe("neutral");
  });
});

describe("describeDifferences", () => {
  it("says nothing when the settings are the same", () => {
    expect(describeDifferences(run(), run())).toEqual([]);
  });

  it("names a changed rule, with the rule written out", () => {
    const changes = describeDifferences(run(), run({ buy_signals: [rsi(40, false)] }));
    expect(changes).toEqual([{ label: "Buy when", a: "RSI (14) is below 30", b: "RSI (14) is below 40" }]);
  });

  it("names each exit rule that changed, with Off for one that is not set", () => {
    const changes = describeDifferences(
      run({ exit_rules: { stop_loss: 4, take_profit: 12 } }),
      run({ exit_rules: { stop_loss: 6, take_profit: 12, trailing_stop: 5 } })
    );
    expect(changes).toEqual([
      { label: "Stop-loss", a: "4%", b: "6%" },
      { label: "Trailing stop", a: "Off", b: "5%" },
    ]);
  });

  it("names a different market and period", () => {
    const changes = describeDifferences(run(), run({
      symbol: "BTC/USD", data_window: { ...WINDOW, covered_end: "2025-02-01T00:00:00+00:00" },
    }));
    expect(changes.map((c) => c.label)).toEqual(["Market", "Period"]);
    expect(changes[0]).toEqual({ label: "Market", a: "AAPL · 1day", b: "BTC/USD · 1day" });
    expect(changes[1].b).toBe("Jan 1, 2025 to Feb 1, 2025");
  });

  it("writes None for a side with no rule", () => {
    const changes = describeDifferences(run(), run({ sell_signals: [] }));
    expect(changes).toEqual([{ label: "Sell when", a: "RSI (14) is above 70", b: "None" }]);
  });
});

describe("naming a run", () => {
  it("uses its name, or its market, and says when it was saved", () => {
    expect(runTitle(run())).toBe("AAPL · 1day");
    expect(runTitle(run({ label: "RSI with a stop" }))).toBe("RSI with a stop");
    expect(runSubtitle(run())).toBe("saved Nov 17, 2026");
    expect(runSubtitle(run({ label: "RSI with a stop" }))).toBe("AAPL · 1day · saved Nov 17, 2026");
  });
});

describe("readoutAt", () => {
  const longer = run();
  const shorter = run({
    symbol: "BTC/USD",
    result: [
      { datetime: "2025-06-01T00:00:00Z", close: 50, owned: 0, return: 50, exit_reason: "" },
      { datetime: "2025-06-02T00:00:00Z", close: 55, owned: 1, return: 55, exit_reason: "" },
    ],
  });

  it("at rest shows each run's own final value, even when one run is shorter", () => {
    const plan = planCompare(longer, shorter);
    const resting = readoutAt(plan, null);
    expect(resting.a).toBeCloseTo(5);
    expect(resting.b).toBeCloseTo(10);
    expect(resting.asset).toBeNull();
  });

  it("while touching, reads each run at that time and shows nothing for a run that does not reach it", () => {
    const plan = planCompare(longer, shorter);
    const during = readoutAt(plan, 2 * 86_400_000);
    expect(during.a).toBeCloseTo(9);
    expect(during.b).toBeNull();
  });

  it("includes the asset only when the runs share a market and period", () => {
    const shared = planCompare(run(), run({ sell_signals: [rsi(80, true)] }));
    expect(readoutAt(shared, null).asset).toBeCloseTo(-10);
    expect(readoutAt(shared, Date.parse("2025-01-03T00:00:00Z")).asset).toBeCloseTo(20);
    expect(readoutAt(planCompare(longer, shorter), null).asset).toBeNull();
  });
});

describe("telling two runs apart", () => {
  it("summarises a run by its gain and trade count", () => {
    expect(runSummary(run())).toBe("+5.0% · 2 trades");
    expect(runSummary(run({ trades: 1 }))).toBe("+5.0% · 1 trade");
  });
});

describe("chart helpers for two runs", () => {
  it("makes scales from an explicit range", () => {
    const scales = makeScalesFor({ timeStart: 0, timeEnd: 100, low: -10, high: 30 }, 120, 110, { left: 10, right: 10, top: 10, bottom: 10 });
    expect(scales.x(0)).toBeCloseTo(10);
    expect(scales.x(100)).toBeCloseTo(110);
    expect(scales.y(30)).toBeLessThan(scales.y(-10));
    expect(scales.yTicks).toContain(0);
  });

  it("copes with a flat or missing value range", () => {
    expect(() => makeScalesFor({ timeStart: 0, timeEnd: 1, low: 5, high: 5 }, 100, 100, { left: 0, right: 0, top: 0, bottom: 0 })).not.toThrow();
    expect(Number.isFinite(makeScalesFor({ timeStart: 0, timeEnd: 1, low: Infinity, high: -Infinity }, 100, 100, { left: 0, right: 0, top: 0, bottom: 0 }).y(0))).toBe(true);
  });

  it("reads a line at a time, between its points, and says nothing outside its range", () => {
    const points = [{ time: 0, price: 0, value: 0 }, { time: 10, price: 5, value: 20 }];
    expect(readAt(points, 5, (p) => p.value)).toBeCloseTo(10);
    expect(readAt(points, 5, (p) => p.price)).toBeCloseTo(2.5);
    expect(readAt(points, 10, (p) => p.value)).toBeCloseTo(20);
    expect(readAt(points, -1, (p) => p.value)).toBeNull();
    expect(readAt(points, 11, (p) => p.value)).toBeNull();
    expect(readAt([], 0, (p) => p.value)).toBeNull();
  });

  it("writes elapsed time in days", () => {
    expect(formatElapsed(0)).toBe("Day 0");
    expect(formatElapsed(182 * 86_400_000)).toBe("Day 182");
  });
});
