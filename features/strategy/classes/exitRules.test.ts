import { Backtest, BacktestResponseDataFormat } from "./Backtest";
import {
  EMPTY_EXIT_RULE_INPUTS, describeExitRules, exitReasonLabel, exitRulesFromData, exitRulesToJSON, hasExitRules,
  parseExitRules, summarizeExits,
} from "./ExitRules";
import { Signal } from "./Signal";
import { Strategy, StrategyData } from "./Strategy";
import { Trade } from "./Trade";
import { IndicatorName, indicators } from "../enums/Indicator";
import { sharedStrategyFromData } from "@/features/sharing/SharedStrategy";

const rsi = (target: number, aboveTarget: boolean) =>
  new Signal(indicators.find(i => i.name === IndicatorName.rsi)!, target, aboveTarget, 14, null, null, null);

const strategyWith = (exitRules = {}) =>
  new Strategy(1, "Risky", "AAPL", "1day", [rsi(30, false)], [rsi(70, true)], [], 1, 1, 1, undefined, true, null, exitRules);

describe("parseExitRules", () => {
  it("treats blank boxes as rules that are off", () => {
    expect(parseExitRules(EMPTY_EXIT_RULE_INPUTS)).toEqual({ rules: {} });
    expect(parseExitRules({ ...EMPTY_EXIT_RULE_INPUTS, stop_loss: "  " })).toEqual({ rules: {} });
  });

  it("reads percentages, including a comma decimal", () => {
    expect(parseExitRules({ stop_loss: "5", trailing_stop: "2,5", take_profit: "10.5" }))
      .toEqual({ rules: { stop_loss: 5, trailing_stop: 2.5, take_profit: 10.5 } });
  });

  it("refuses values the server would refuse, naming the rule", () => {
    for (const bad of ["abc", "0", "-3", "100", "NaN"]) {
      const result = parseExitRules({ ...EMPTY_EXIT_RULE_INPUTS, stop_loss: bad });
      expect(result.error).toMatch(/Stop-loss must be a percent between 0.01 and 99.99/);
    }
    expect(parseExitRules({ ...EMPTY_EXIT_RULE_INPUTS, take_profit: "1001" }).error).toMatch(/Take-profit/);
    expect(parseExitRules({ ...EMPTY_EXIT_RULE_INPUTS, take_profit: "1000" }).error).toBeUndefined();
  });
});

describe("exitRulesFromData", () => {
  it("keeps good rules and drops unknown names, bad values and non-objects", () => {
    expect(exitRulesFromData({ stop_loss: 5, take_profit: 0, trailing_stop: "4", other: 9 })).toEqual({ stop_loss: 5 });
    expect(exitRulesFromData(undefined)).toEqual({});
    expect(exitRulesFromData(null)).toEqual({});
    expect(exitRulesFromData("x")).toEqual({});
  });
});

describe("wording", () => {
  it("describes each rule in plain words, in a fixed order", () => {
    expect(describeExitRules({ take_profit: 10, stop_loss: 5, trailing_stop: 4 })).toEqual([
      "Sell if the price falls 5% below the buy price",
      "Sell if the price falls 4% below its highest point since the buy",
      "Sell if the price rises 10% above the buy price",
    ]);
    expect(describeExitRules({})).toEqual([]);
  });

  it("labels a trade's exit reason, and nothing for a signal sell or an unknown reason", () => {
    expect(exitReasonLabel("stop_loss")).toBe("Stop-loss");
    expect(exitReasonLabel("trailing_stop")).toBe("Trailing stop");
    expect(exitReasonLabel("")).toBeNull();
    expect(exitReasonLabel(null)).toBeNull();
    expect(exitReasonLabel("margin_call")).toBeNull();
  });

  it("summarises the exits a backtest made", () => {
    expect(summarizeExits(["stop_loss", "", "stop_loss", "take_profit", null])).toBe("2 stop-loss exits, 1 take-profit exit");
    expect(summarizeExits(["", null])).toBeNull();
  });
});

describe("requests", () => {
  it("send no exit_rules when none are set, so the body is what it was before", () => {
    expect(JSON.parse(strategyWith().toSubscribeJSON())).not.toHaveProperty("exit_rules");
    const backtest = new Backtest(strategyWith(), new Date("2024-01-01"), new Date("2024-02-01"));
    expect(JSON.parse(backtest.toRequestJSON())).not.toHaveProperty("exit_rules");
  });

  it("send only the rules that are on, in the server's names", () => {
    const strategy = strategyWith({ stop_loss: 5, take_profit: 10 });
    expect(JSON.parse(strategy.toSubscribeJSON()).exit_rules).toEqual({ stop_loss: 5, take_profit: 10 });
    const backtest = new Backtest(strategy, new Date("2024-01-01"), new Date("2024-02-01"));
    expect(JSON.parse(backtest.toRequestJSON()).exit_rules).toEqual({ stop_loss: 5, take_profit: 10 });
    expect(exitRulesToJSON({ stop_loss: 5 })).toEqual({ stop_loss: 5 });
    expect(hasExitRules({})).toBe(false);
  });
});

describe("a strategy from the server and from storage", () => {
  const data: StrategyData = {
    id: 3, title: "Risky", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [],
    exit_rules: { trailing_stop: 4 },
    trades: [
      { date: "2024-01-02T00:00:00Z", price: 10, is_buy: true, exit_reason: "" },
      { date: "2024-01-05T00:00:00Z", price: 9, is_buy: false, exit_reason: "trailing_stop" },
    ],
    strategy_return: 1, asset_return: 1, position: 1, charge_user_date: "2024-02-01T00:00:00Z", active: true,
  };

  it("carries its exit rules and each trade's reason", () => {
    const strategy = Strategy.fromData(data);
    expect(strategy.exitRules).toEqual({ trailing_stop: 4 });
    expect(strategy.trades.map(t => t.exitReason)).toEqual([null, "trailing_stop"]);
  });

  it("an older server that sends neither still works", () => {
    const { exit_rules, ...old } = data;
    const strategy = Strategy.fromData({ ...old, trades: [{ date: "2024-01-02T00:00:00Z", price: 10, is_buy: true }] });
    expect(strategy.exitRules).toEqual({});
    expect(strategy.trades[0].exitReason).toBeNull();
  });

  it("keeps them through the copy kept in storage", () => {
    const stored = JSON.parse(JSON.stringify(Strategy.fromData(data)));
    const restored = Strategy.fromStored(stored);
    expect(restored.exitRules).toEqual({ trailing_stop: 4 });
    expect(restored.trades[1].exitReason).toBe("trailing_stop");
  });

  it("a copy stored before exit rules existed reads as no rules", () => {
    const stored = JSON.parse(JSON.stringify(Strategy.fromData(data)));
    delete stored.exitRules;
    expect(Strategy.fromStored(stored).exitRules).toEqual({});
  });
});

describe("a backtest result", () => {
  const row = (day: number, close: number, owned: number, exit_reason = "") => ({
    datetime: `2024-01-0${day}T00:00:00Z`, close, buy: false, sell: false, owned, return: close, exit_reason,
  });
  const response = (result: ReturnType<typeof row>[]) => ({
    result, image: "", image_no_signals: "", percent_return: 0, percent_return_adj: 0, sharpe_ratio: 0,
    sharpe_ratio_adj: 0, sortino_ratio: 0, sortino_ratio_adj: 0, user_account_credits: 0, user_monthly_credits: 0,
  }) as BacktestResponseDataFormat;

  it("marks a sell made by a rule with its reason and summarises the exits", () => {
    const backtest = new Backtest(strategyWith({ stop_loss: 5 }), new Date("2024-01-01"), new Date("2024-01-09"))
      .updateFromData(response([row(1, 10, 0), row(2, 10, 1), row(3, 9, 0, "stop_loss"), row(4, 9, 0)]));
    expect(backtest.strategy.trades.map((t: Trade) => [t.isBuy, t.exitReason])).toEqual([[true, null], [false, "stop_loss"]]);
    expect(backtest.exitSummary).toBe("1 stop-loss exit");
  });

  it("has no summary and no reasons for a plain signal sell, or from a server that sends none", () => {
    const plain = new Backtest(strategyWith(), new Date("2024-01-01"), new Date("2024-01-09"))
      .updateFromData(response([row(1, 10, 0), row(2, 10, 1), row(3, 11, 0)]));
    expect(plain.exitSummary).toBeNull();
    expect(plain.strategy.trades[1].exitReason).toBeNull();
    const oldServer = response([row(1, 10, 0), row(2, 10, 1), row(3, 11, 0)]);
    oldServer.result.forEach((r: any) => delete r.exit_reason);
    expect(new Backtest(strategyWith(), new Date("2024-01-01"), new Date("2024-01-09")).updateFromData(oldServer).exitSummary).toBeNull();
  });
});

describe("a shared strategy", () => {
  const base = { title: "T", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [], strategy_return: "1.1", asset_return: "1.0" };

  it("shows the rules the owner set", () => {
    expect(sharedStrategyFromData({ ...base, exit_rules: { stop_loss: 5 } }).exitRules).toEqual({ stop_loss: 5 });
  });

  it("has none when an older server leaves them out", () => {
    expect(sharedStrategyFromData(base).exitRules).toEqual({});
  });
});
