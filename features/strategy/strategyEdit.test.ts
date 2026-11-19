import { Strategy, StrategyData } from "./classes/Strategy";
import { Signal } from "./classes/Signal";
import { Trade } from "./classes/Trade";
import { IndicatorName, indicators } from "./enums/Indicator";
import { SharedStrategyData, sharedStrategyFromData } from "@/features/sharing/SharedStrategy";
import {
  buildEditBody, describeEditRecord, editsFromData, startingFields, summarizeEdit, sameSignals, tradeRows, validateEdit,
  EditedFields,
} from "./strategyEdit";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

const indicator = (name: IndicatorName) => indicators.find((i) => i.name === name)!;
const rsi = (target: number, aboveTarget: boolean, version = 2) =>
  new Signal(indicator(IndicatorName.rsi), target, aboveTarget, 14, null, null, null, version);
const sma = (window: number, aboveTarget: boolean) =>
  new Signal(indicator(IndicatorName.sma), 1, aboveTarget, window, null, null, null);

const strategy = (overrides: Partial<{ buy: Signal[]; sell: Signal[]; exit: object; title: string }> = {}) =>
  new Strategy(7, overrides.title ?? "Momentum", "AAPL", "1day", overrides.buy ?? [rsi(30, false)], overrides.sell ?? [rsi(70, true)],
    [], 1.2, 1.1, 2, undefined, true, null, (overrides.exit ?? {}) as never);

const same = (s: Strategy): EditedFields => startingFields(s);

describe("startingFields", () => {
  it("copies the strategy's fields so editing them cannot change the strategy on screen", () => {
    const s = strategy({ exit: { stop_loss: 5 } });
    const fields = startingFields(s);
    fields.buySignals[0].targetValue = 99;
    fields.exitRules.stop_loss = 1;
    fields.title = "x";
    expect(s.buySignals[0].targetValue).toBe(30);
    expect(s.exitRules.stop_loss).toBe(5);
    expect(s.title).toBe("Momentum");
  });
});

describe("sameSignals", () => {
  it("ignores order and the indicator version, and notices a changed number or side", () => {
    expect(sameSignals([sma(5, false), sma(9, false)], [sma(9, false), sma(5, false)])).toBe(true);
    expect(sameSignals([rsi(30, false, 1)], [rsi(30, false, 2)])).toBe(true);
    expect(sameSignals([rsi(30, false)], [rsi(31, false)])).toBe(false);
    expect(sameSignals([rsi(30, false)], [rsi(30, true)])).toBe(false);
    expect(sameSignals([rsi(30, false)], [rsi(30, false), rsi(40, false)])).toBe(false);
  });
});

describe("summarizeEdit", () => {
  it("says nothing changed when nothing did", () => {
    expect(summarizeEdit(strategy(), same(strategy()))).toEqual({ titleChanged: false, rulesChanged: false, lines: [] });
  });

  it("says what a changed rule was and is, in words", () => {
    const s = strategy();
    const edited = { ...same(s), buySignals: [rsi(40, false)] };
    const summary = summarizeEdit(s, edited);
    expect(summary.rulesChanged).toBe(true);
    expect(summary.lines).toEqual([{ label: "Buy when", from: "RSI (14) is below 30", to: "RSI (14) is below 40" }]);
  });

  it("says None for a side with no rules", () => {
    const s = strategy();
    const summary = summarizeEdit(s, { ...same(s), sellSignals: [] });
    expect(summary.lines).toEqual([{ label: "Sell when", from: "RSI (14) is above 70", to: "None" }]);
  });

  it("names each exit rule that was added, changed or turned off", () => {
    const s = strategy({ exit: { stop_loss: 5, take_profit: 10 } });
    const summary = summarizeEdit(s, { ...same(s), exitRules: { stop_loss: 6, trailing_stop: 4 } });
    expect(summary.rulesChanged).toBe(true);
    expect(summary.lines).toEqual([
      { label: "Stop-loss", from: "5%", to: "6%" },
      { label: "Trailing stop", from: "Off", to: "4%" },
      { label: "Take-profit", from: "10%", to: "Off" },
    ]);
  });

  it("a new name alone is not a change to the rules", () => {
    const s = strategy();
    const summary = summarizeEdit(s, { ...same(s), title: "  Renamed  " });
    expect(summary).toEqual({ titleChanged: true, rulesChanged: false, lines: [{ label: "Name", from: "Momentum", to: "Renamed" }] });
  });

  it("the same rules in another order are not a change", () => {
    const s = strategy({ buy: [sma(5, false), sma(9, false)] });
    expect(summarizeEdit(s, { ...same(s), buySignals: [sma(9, false), sma(5, false)] }).lines).toEqual([]);
  });
});

describe("validateEdit", () => {
  it("accepts a good edit and names what is wrong with a bad one", () => {
    const s = strategy();
    expect(validateEdit(same(s))).toBeNull();
    expect(validateEdit({ ...same(s), title: "   " })).toMatch(/name/);
    expect(validateEdit({ ...same(s), title: "x".repeat(51) })).toMatch(/50/);
    expect(validateEdit({ ...same(s), buySignals: [] })).toMatch(/buy signal/);
    expect(validateEdit({ ...same(s), sellSignals: [] })).toBeNull(); // a strategy may have no sell rule
  });
});

describe("buildEditBody", () => {
  it("is null when nothing changed", () => {
    expect(buildEditBody(strategy(), same(strategy()))).toBeNull();
  });

  it("sends only the name for a rename, so the rules cannot be touched", () => {
    const s = strategy();
    expect(JSON.parse(buildEditBody(s, { ...same(s), title: "New name" })!)).toEqual({ title: "New name" });
  });

  it("sends all the signals, buy and sell, when any signal changed, and nothing else", () => {
    const s = strategy();
    const body = JSON.parse(buildEditBody(s, { ...same(s), buySignals: [rsi(40, false)] })!);
    expect(Object.keys(body)).toEqual(["signals"]);
    expect(body.signals.map((x: { buy_signal: boolean; target_value: number }) => [x.buy_signal, x.target_value])).toEqual([[true, 40], [false, 70]]);
  });

  it("sends the exit rules that are on, and an empty object to turn them all off", () => {
    const s = strategy({ exit: { stop_loss: 5 } });
    expect(JSON.parse(buildEditBody(s, { ...same(s), exitRules: { stop_loss: 5, take_profit: 12 } })!)).toEqual({ exit_rules: { stop_loss: 5, take_profit: 12 } });
    expect(JSON.parse(buildEditBody(s, { ...same(s), exitRules: {} })!)).toEqual({ exit_rules: {} });
  });

  it("sends the signals in the version the strategy already uses, even a newly added one", () => {
    const legacy = strategy({ buy: [rsi(30, false, 1)], sell: [rsi(70, true, 1)] });
    const body = JSON.parse(buildEditBody(legacy, { ...same(legacy), buySignals: [rsi(30, false, 1), sma(20, false)] })!);
    expect(body.signals.map((x: { version: number }) => x.version)).toEqual([1, 1, 1]);
  });

  it("sends everything that changed together", () => {
    const s = strategy();
    const body = JSON.parse(buildEditBody(s, { title: "B", buySignals: [rsi(35, false)], sellSignals: [rsi(70, true)], exitRules: { trailing_stop: 4 } })!);
    expect(Object.keys(body).sort()).toEqual(["exit_rules", "signals", "title"]);
  });
});

describe("the edit record", () => {
  it("reads the server's record, in time order, and names the parts that changed", () => {
    const edits = editsFromData([
      { date: "2026-11-18T12:00:00Z", changes: { exit_rules: { from: {}, to: { stop_loss: 5 } }, buy_signals: { from: [], to: [] } } },
      { date: "2026-11-10T12:00:00Z", changes: { sell_signals: { from: [], to: [] } } },
    ]);
    expect(edits.map((e) => e.changed)).toEqual([["sell_signals"], ["buy_signals", "exit_rules"]]);
    expect(edits[0].date.toISOString()).toBe("2026-11-10T12:00:00.000Z");
  });

  it("reads the stored copy's shape too, and drops what is not a dated record", () => {
    expect(editsFromData([{ date: "2026-11-18T00:00:00Z", changed: ["exit_rules", "bogus"] }])[0].changed).toEqual(["exit_rules"]);
    expect(editsFromData([{ date: "nope", changes: {} }, null, 5, {}])).toEqual([]);
    expect(editsFromData(undefined)).toEqual([]);
    expect(editsFromData("x")).toEqual([]);
  });

  it("describes an edit in plain words", () => {
    const at = new Date();
    expect(describeEditRecord({ date: at, changed: ["exit_rules"] })).toBe("Changed the exit rules");
    expect(describeEditRecord({ date: at, changed: ["buy_signals", "exit_rules"] })).toBe("Changed the buy rules and the exit rules");
    expect(describeEditRecord({ date: at, changed: ["buy_signals", "sell_signals", "exit_rules"] })).toBe("Changed the buy rules, the sell rules and the exit rules");
    expect(describeEditRecord({ date: at, changed: [] })).toBe("Changed the rules");
  });
});

describe("tradeRows", () => {
  const trade = (day: number, isBuy = true) => new Trade(new Date(Date.UTC(2026, 10, day)), 100, isBuy);
  const edit = (day: number) => ({ date: new Date(Date.UTC(2026, 10, day, 12)), changed: ["exit_rules" as const] });

  it("puts a marker where the rules changed, between the trades before and after", () => {
    const rows = tradeRows([trade(1), trade(5, false), trade(9), trade(12, false)], [edit(6)]);
    expect(rows.map((r) => (r.kind === "trade" ? `t${r.index}` : "edit"))).toEqual(["t0", "t1", "edit", "t2", "t3"]);
  });

  it("keeps every trade, with its own index, and handles several edits and an edit after the last trade", () => {
    const rows = tradeRows([trade(1), trade(9)], [edit(3), edit(4), edit(20)]);
    expect(rows.map((r) => (r.kind === "trade" ? `t${r.index}` : "edit"))).toEqual(["t0", "edit", "edit", "t1", "edit"]);
  });

  it("is just the trades when there are no edits, and just the edits when there are no trades", () => {
    expect(tradeRows([trade(1), trade(2)], []).map((r) => r.kind)).toEqual(["trade", "trade"]);
    expect(tradeRows([], [edit(3)]).map((r) => r.kind)).toEqual(["edit"]);
    expect(tradeRows([], [])).toEqual([]);
  });
});

describe("on a strategy and a shared strategy", () => {
  const data = (extra: Partial<StrategyData> = {}): StrategyData => ({
    id: 3, title: "T", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [], trades: [],
    strategy_return: 1, asset_return: 1, position: 1, charge_user_date: "2026-12-01T00:00:00Z", active: true, ...extra,
  });

  it("carries when the rules changed and the record, from the server and from storage", () => {
    const s = Strategy.fromData(data({ rules_changed_at: "2026-11-18T10:00:00Z", edits: [{ date: "2026-11-18T10:00:00Z", changes: { exit_rules: {} } }] }));
    expect(s.rulesChangedAt?.toISOString()).toBe("2026-11-18T10:00:00.000Z");
    expect(s.edits.map((e) => e.changed)).toEqual([["exit_rules"]]);
    const restored = Strategy.fromStored(JSON.parse(JSON.stringify(s)));
    expect(restored.rulesChangedAt?.toISOString()).toBe("2026-11-18T10:00:00.000Z");
    expect(restored.edits.map((e) => e.changed)).toEqual([["exit_rules"]]);
  });

  it("has none from an older server or an older stored copy", () => {
    const s = Strategy.fromData(data());
    expect([s.rulesChangedAt, s.edits]).toEqual([null, []]);
    const stored = JSON.parse(JSON.stringify(s));
    delete stored.rulesChangedAt;
    delete stored.edits;
    expect(Strategy.fromStored(stored).rulesChangedAt).toBeNull();
  });

  it("shows a shared strategy's last change date, or none", () => {
    const base: SharedStrategyData = { title: "T", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [], strategy_return: "1", asset_return: "1" };
    expect(sharedStrategyFromData({ ...base, rules_changed_at: "2026-11-18T10:00:00Z" }).rulesChangedAt?.toISOString()).toBe("2026-11-18T10:00:00.000Z");
    expect(sharedStrategyFromData({ ...base, rules_changed_at: null }).rulesChangedAt).toBeNull();
    expect(sharedStrategyFromData(base).rulesChangedAt).toBeNull();
  });
});
