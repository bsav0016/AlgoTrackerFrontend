import { Backtest, SavedBacktestDetailData } from "./classes/Backtest";
import { EMPTY_EXIT_RULE_INPUTS, exitRulesToInputs, parseExitRules } from "./classes/ExitRules";
import { Signal } from "./classes/Signal";
import { IndicatorName, indicators } from "./enums/Indicator";
import { builderSeedFrom, dateParts } from "./rerun";

const rsi = indicators.find((i) => i.name === IndicatorName.rsi)!;

const signal = (target: number, aboveTarget: boolean) => ({
  name: "RSI", above_target: aboveTarget, target_value: target, window: 14, fast_window: null, slow_window: null,
  signal_window: null, version: 2,
});

const saved = (overrides: Partial<SavedBacktestDetailData> = {}): SavedBacktestDetailData => ({
  id: 7, label: "", created_at: "2026-11-17T12:00:00Z", symbol: "AAPL", interval: "1day",
  covered_start: "2025-11-18T00:00:00+00:00", covered_end: "2026-11-13T00:00:00+00:00",
  requested_start: new Date(2025, 10, 17).toISOString(), requested_end: new Date(2026, 10, 16).toISOString(),
  period_return: 5, trades: 1, has_exit_rules: true,
  buy_signals: [signal(30, false)], sell_signals: [signal(70, true)], exit_rules: { stop_loss: 4, take_profit: 12.5 },
  next_candle_execution: false,
  percent_return: 0, percent_return_adj: 0, period_return_adj: 0, period_return_before_costs: 0,
  annualized_is_extrapolated: false, trade_cost_percent: 0.1, sharpe_ratio: 0, sharpe_ratio_adj: 0,
  sortino_ratio: 0, sortino_ratio_adj: 0,
  result: [{ datetime: "2025-11-18T00:00:00Z", close: 100, owned: 0, return: 100, exit_reason: "" }],
  ...overrides,
} as SavedBacktestDetailData);

describe("dateParts", () => {
  it("reads a date the way the builder boxes hold it, without padding", () => {
    expect(dateParts(new Date(2026, 0, 5))).toEqual({ month: "1", day: "5", year: "2026" });
    expect(dateParts(new Date(2025, 10, 17))).toEqual({ month: "11", day: "17", year: "2025" });
  });
});

describe("exitRulesToInputs", () => {
  it("is blank for rules that are off and the number for rules that are on", () => {
    expect(exitRulesToInputs({})).toEqual(EMPTY_EXIT_RULE_INPUTS);
    expect(exitRulesToInputs({ stop_loss: 4, take_profit: 12.5 })).toEqual({ stop_loss: "4", trailing_stop: "", take_profit: "12.5" });
  });

  it("round-trips through what the builder parses when you press run", () => {
    const rules = { stop_loss: 4, trailing_stop: 2.5, take_profit: 12.5 };
    expect(parseExitRules(exitRulesToInputs(rules))).toEqual({ rules });
  });
});

describe("Signal.clone", () => {
  it("is an equal copy that can be changed without touching the original", () => {
    const original = new Signal(rsi, 30, false, 14, null, null, null, 2);
    const copy = original.clone();
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    copy.targetValue = 99;
    copy.window = 3;
    expect(original.targetValue).toBe(30);
    expect(original.window).toBe(14);
  });
});

describe("builderSeedFrom", () => {
  it("carries the symbol, interval, rules, exit rules and dates of the run", () => {
    const seed = builderSeedFrom(Backtest.fromSaved(saved()));
    expect(seed.symbol).toBe("AAPL");
    expect(seed.interval).toBe("1day");
    expect(seed.buySignals.map((s) => [s.indicator.name, s.aboveTarget, s.targetValue, s.window])).toEqual([["RSI", false, 30, 14]]);
    expect(seed.sellSignals.map((s) => [s.indicator.name, s.aboveTarget, s.targetValue])).toEqual([["RSI", true, 70]]);
    expect(seed.exitRuleInputs).toEqual({ stop_loss: "4", trailing_stop: "", take_profit: "12.5" });
    expect(seed.startDate).toEqual({ month: "11", day: "17", year: "2025" });
    expect(seed.endDate).toEqual({ month: "11", day: "16", year: "2026" });
  });

  it("gives the builder copies of the signals, not the ones the results screen is still showing", () => {
    const backtest = Backtest.fromSaved(saved());
    const seed = builderSeedFrom(backtest);
    seed.buySignals[0].targetValue = 5;
    seed.sellSignals[0].aboveTarget = false;
    expect(backtest.strategy.buySignals[0].targetValue).toBe(30);
    expect(backtest.strategy.sellSignals[0].aboveTarget).toBe(true);
  });

  it("works for a run with no exit rules (an older saved run sends none)", () => {
    const seed = builderSeedFrom(Backtest.fromSaved(saved({ exit_rules: undefined })));
    expect(seed.exitRuleInputs).toEqual(EMPTY_EXIT_RULE_INPUTS);
  });

  it("runs again with the same request when nothing is changed", () => {
    const backtest = Backtest.fromSaved(saved());
    const seed = builderSeedFrom(backtest);
    const rebuilt = new Backtest(
      // what the builder does on Run Backtest: a strategy from its boxes, dates from its date boxes
      Object.assign(Object.create(Object.getPrototypeOf(backtest.strategy)), backtest.strategy, {
        buySignals: seed.buySignals, sellSignals: seed.sellSignals,
        exitRules: parseExitRules(seed.exitRuleInputs).rules,
      }),
      new Date(Number(seed.startDate.year), Number(seed.startDate.month) - 1, Number(seed.startDate.day)),
      new Date(Number(seed.endDate.year), Number(seed.endDate.month) - 1, Number(seed.endDate.day)),
    );
    expect(JSON.parse(rebuilt.toRequestJSON())).toEqual(JSON.parse(backtest.toRequestJSON()));
  });
});
