import { Signal, SignalData } from "./Signal";
import { Strategy, StrategyData } from "./Strategy";
import { IndicatorName, comparableIndicators, defaultParams, indicators, isComparable } from "../enums/Indicator";
import { buildEditBody, sameSignals, startingFields, summarizeEdit } from "../strategyEdit";
import { describeSignal, sharedStrategyFromData } from "@/features/sharing/SharedStrategy";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

// Rules that compare two indicators (AlgoTrackerBackend: SignalSerializer.compare_to, stage 2 of its issue #89).

const indicator = (name: IndicatorName) => indicators.find((i) => i.name === name)!;
const average = (name: IndicatorName, window: number, otherName: IndicatorName, otherWindow: number, aboveTarget = true) =>
  new Signal(indicator(name), 0, aboveTarget, window, null, null, null, 2, { indicator: indicator(otherName), window: otherWindow });
const crossover = (aboveTarget: boolean) => average(IndicatorName.smaPrice, 20, IndicatorName.smaPrice, 50, aboveTarget);
const rsi = (target: number, aboveTarget: boolean) => new Signal(indicator(IndicatorName.rsi), target, aboveTarget, 14, null, null, null);

const strategy = (buy: Signal[], sell: Signal[]) => new Strategy(7, "Crossover", "AAPL", "1day", buy, sell, [], 1, 1, 2, undefined, true, null, {} as never);

describe("the price averages", () => {
  it("are the only indicators a rule can be compared with, and have default settings", () => {
    expect(comparableIndicators.map((i) => i.name)).toEqual([IndicatorName.smaPrice, IndicatorName.emaPrice]);
    expect(isComparable("SMA_PRICE")).toBe(true);
    expect(isComparable("RSI")).toBe(false);
    for (const name of [IndicatorName.smaPrice, IndicatorName.emaPrice]) {
      expect(defaultParams[name]).toMatchObject({ targetValue: 0, Window: 20 });
    }
  });
});

describe("Signal with compare_to", () => {
  it("is sent with compare_to and no target number", () => {
    expect(crossover(true).toJSON(true)).toEqual({
      name: "SMA_PRICE", above_target: true, buy_signal: true, target_value: 0, window: 20, fast_window: null,
      slow_window: null, signal_window: null, version: 2, compare_to: { name: "SMA_PRICE", window: 50 },
    });
  });

  it("ignores a stale target number when it is sent", () => {
    const signal = crossover(true);
    signal.targetValue = 42;
    expect(signal.toJSON(true).target_value).toBe(0);
  });

  it("sends an ordinary rule with exactly the keys it always had", () => {
    expect(Object.keys(rsi(30, false).toJSON(true)).sort()).toEqual([
      "above_target", "buy_signal", "fast_window", "name", "signal_window", "slow_window", "target_value", "version", "window",
    ]);
  });

  it("is read from the server's data, and older data without it has none", () => {
    const data: SignalData = {
      name: "EMA_PRICE", target_value: 0, above_target: false, window: 10, fast_window: null, slow_window: null,
      signal_window: null, version: 2, compare_to: { name: "SMA_PRICE", window: 30 },
    };
    const signal = Signal.fromData(data);
    expect(signal.compareTo?.indicator.name).toBe(IndicatorName.smaPrice);
    expect(signal.compareTo?.window).toBe(30);
    const { compare_to: _unused, ...older } = data;
    expect(Signal.fromData({ ...older, name: "RSI", target_value: 30 }).compareTo).toBeNull();
    expect(Signal.fromData({ ...data, compare_to: null }).compareTo).toBeNull();
  });

  it("refuses a second indicator this version of the app does not know, as it does for the first", () => {
    const data: SignalData = {
      name: "SMA_PRICE", target_value: 0, above_target: true, window: 20, fast_window: null, slow_window: null,
      signal_window: null, compare_to: { name: "VWAP", window: 5 },
    };
    expect(() => Signal.fromData(data)).toThrow("Invalid indicator value: VWAP");
  });

  it("is copied independently, so editing the copy leaves the original alone", () => {
    const original = crossover(true);
    const copy = original.clone();
    copy.compareTo!.window = 99;
    expect(original.compareTo!.window).toBe(50);
    expect(copy.compareTo!.indicator.name).toBe(IndicatorName.smaPrice);
  });
});

describe("describing a comparison rule", () => {
  it("reads in plain words with the windows", () => {
    expect(describeSignal(crossover(true))).toBe("The 20-candle simple average is above the 50-candle simple average");
    expect(describeSignal(crossover(false))).toBe("The 20-candle simple average is below the 50-candle simple average");
    expect(describeSignal(average(IndicatorName.emaPrice, 12, IndicatorName.smaPrice, 26)))
      .toBe("The 12-candle exponential average is above the 26-candle simple average");
  });

  it("leaves ordinary rules as they were", () => {
    expect(describeSignal(rsi(30, false))).toBe("RSI (14) is below 30");
  });

  it("is what a shared strategy shows for a comparison", () => {
    const shared = sharedStrategyFromData({
      title: "Crossover", symbol: "AAPL", interval: "1day", strategy_return: "1.1", asset_return: "1.05",
      buy_signals: [crossover(true).toJSON(true) as SignalData], sell_signals: [crossover(false).toJSON(false) as SignalData],
    });
    expect(describeSignal(shared.buySignals[0])).toContain("above the 50-candle simple average");
    expect(describeSignal(shared.sellSignals[0])).toContain("below the 50-candle simple average");
  });
});

describe("a strategy with comparison rules", () => {
  const data = (): StrategyData => ({
    id: 3, title: "Crossover", symbol: "AAPL", interval: "1day",
    buy_signals: [crossover(true).toJSON(true) as SignalData], sell_signals: [crossover(false).toJSON(false) as SignalData],
    trades: [], strategy_return: "1", asset_return: "1", position: 1, charge_user_date: "2026-01-01T00:00:00Z", active: true,
  } as unknown as StrategyData);

  it("is read from the server and sent back with its comparison", () => {
    const built = Strategy.fromData(data());
    expect(built.buySignals[0].compareTo?.window).toBe(50);
    const body = JSON.parse(built.toSubscribeJSON());
    expect(body.signals[0].compare_to).toEqual({ name: "SMA_PRICE", window: 50 });
    expect(body.signals[1].compare_to).toEqual({ name: "SMA_PRICE", window: 50 });
  });
});

describe("editing comparison rules", () => {
  it("tells apart rules that differ only in the second average", () => {
    const a = [average(IndicatorName.smaPrice, 20, IndicatorName.smaPrice, 50)];
    expect(sameSignals(a, [average(IndicatorName.smaPrice, 20, IndicatorName.smaPrice, 50)])).toBe(true);
    expect(sameSignals(a, [average(IndicatorName.smaPrice, 20, IndicatorName.smaPrice, 100)])).toBe(false);
    expect(sameSignals(a, [average(IndicatorName.smaPrice, 20, IndicatorName.emaPrice, 50)])).toBe(false);
    expect(sameSignals(a, [rsi(30, false)])).toBe(false);
  });

  it("is not a change when nothing was touched, and is one when the slow window changes", () => {
    const original = strategy([crossover(true)], [crossover(false)]);
    expect(buildEditBody(original, startingFields(original))).toBeNull();
    const edited = startingFields(original);
    edited.buySignals[0].compareTo!.window = 100;
    expect(summarizeEdit(original, edited)).toMatchObject({ rulesChanged: true });
    const body = JSON.parse(buildEditBody(original, edited)!);
    expect(body.signals.find((s: { buy_signal: boolean }) => s.buy_signal).compare_to.window).toBe(100);
  });

  it("summarises a change from a number rule to a comparison in words", () => {
    const original = strategy([rsi(30, false)], [rsi(70, true)]);
    const edited = startingFields(original);
    edited.buySignals = [crossover(true)];
    const summary = summarizeEdit(original, edited);
    expect(summary.lines[0]).toEqual({
      label: "Buy when", from: "RSI (14) is below 30", to: "The 20-candle simple average is above the 50-candle simple average",
    });
  });
});
