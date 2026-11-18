import { Backtest, SavedBacktestDetailData } from "./classes/Backtest";
import { PlainNumbers, formatBuysAndSells, plainNumbersFromData, plainWordsRows } from "./plainWords";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

const numbers = (overrides: Partial<PlainNumbers> = {}): PlainNumbers => ({
  maxDrawdown: -18.18, assetMaxDrawdown: -25.62, closedTrades: 2, winningTrades: 1, winRate: 50, averageTrade: 0,
  bestTrade: 10, worstTrade: -10, timeInvested: 66.67, openTrade: true, ...overrides,
});

describe("plainNumbersFromData", () => {
  it("reads the server's numbers", () => {
    expect(plainNumbersFromData({
      max_drawdown: -18.2, asset_max_drawdown: -25.6, closed_trades: 2, winning_trades: 1, win_rate: 50,
      average_trade: 0, best_trade: 10, worst_trade: -10, time_invested: 66.7, open_trade: true,
    })).toEqual({
      maxDrawdown: -18.2, assetMaxDrawdown: -25.6, closedTrades: 2, winningTrades: 1, winRate: 50, averageTrade: 0,
      bestTrade: 10, worstTrade: -10, timeInvested: 66.7, openTrade: true,
    });
  });

  it("is null when the server sent none of them, as for a run saved before they existed", () => {
    expect(plainNumbersFromData({})).toBeNull();
  });

  it("keeps a missing figure as null and drops anything that is not a number", () => {
    const read = plainNumbersFromData({ closed_trades: 0, win_rate: null, average_trade: "x" as unknown as number, time_invested: NaN });
    expect(read).toMatchObject({ closedTrades: 0, winRate: null, averageTrade: null, timeInvested: null, openTrade: null });
  });
});

describe("plainWordsRows", () => {
  it("writes the three rows in words, with holding for comparison and the open trade noted", () => {
    const rows = plainWordsRows(numbers());
    expect(rows.map((r) => r.key)).toEqual(["drop", "trades", "invested"]);
    expect(rows[0]).toMatchObject({ label: "Biggest drop", value: "18.2%" });
    expect(rows[0].detail).toBe("At its worst the strategy was 18.2% below its earlier high. Just holding fell 25.6%.");
    expect(rows[1]).toMatchObject({ label: "Winning trades", value: "1 of 2 (50%)" });
    expect(rows[1].detail).toBe(
      "A trade is a buy and the sell that closes it. Average trade 0.0%, best +10.0%, worst -10.0%. A trade that was still open at the end is not counted.");
    expect(rows[2]).toMatchObject({ label: "Time invested", value: "67%" });
  });

  it("says so when the strategy never fell, and when holding never did either", () => {
    const rows = plainWordsRows(numbers({ maxDrawdown: 0, assetMaxDrawdown: 0 }));
    expect(rows[0].value).toBe("None");
    expect(rows[0].detail).toBe("The strategy never fell below an earlier high. Just holding never fell.");
  });

  it("leaves holding out of the sentence when it is not known", () => {
    expect(plainWordsRows(numbers({ assetMaxDrawdown: null }))[0].detail).toBe(
      "At its worst the strategy was 18.2% below its earlier high.");
  });

  it("explains a run with no finished trade, open or not", () => {
    const open = plainWordsRows(numbers({ closedTrades: 0, winningTrades: 0, winRate: null, averageTrade: null, bestTrade: null, worstTrade: null, openTrade: true }))[1];
    expect(open).toMatchObject({ value: "No finished trades", detail: "A trade was still open at the end of the period." });
    const never = plainWordsRows(numbers({ closedTrades: 0, winningTrades: 0, winRate: null, averageTrade: null, bestTrade: null, worstTrade: null, openTrade: false }))[1];
    expect(never.detail).toBe("The strategy never traded in this period.");
  });

  it("leaves a row out when its numbers are unknown instead of guessing", () => {
    const rows = plainWordsRows(numbers({ maxDrawdown: null, closedTrades: null, timeInvested: null }));
    expect(rows).toEqual([]);
  });

  it("shows a tiny time invested as under 1% and a finished run without an open trade note", () => {
    const rows = plainWordsRows(numbers({ timeInvested: 0.4, openTrade: false }));
    expect(rows[2].value).toBe("Under 1%");
    expect(rows[1].detail).toBe("A trade is a buy and the sell that closes it. Average trade 0.0%, best +10.0%, worst -10.0%.");
  });

  it("copes with a missing win rate or average", () => {
    const row = plainWordsRows(numbers({ winRate: null, averageTrade: null, bestTrade: null, worstTrade: 3, openTrade: false }))[1];
    expect(row.value).toBe("1 of 2");
    expect(row.detail).toBe("A trade is a buy and the sell that closes it. worst +3.0%.");
  });
});

describe("formatBuysAndSells", () => {
  it("counts every buy and every sell, and says so", () => {
    expect(formatBuysAndSells(27)).toBe("27 buys and sells");
    expect(formatBuysAndSells(1)).toBe("1 buy or sell");
    expect(formatBuysAndSells(0)).toBe("0 buys and sells");
  });
});

describe("on a backtest", () => {
  const detail = (extra: Record<string, unknown> = {}) => ({
    id: 1, label: "", created_at: "2026-11-17T12:00:00Z", symbol: "AAPL", interval: "1day",
    requested_start: "2025-01-01T00:00:00Z", requested_end: "2025-01-05T00:00:00Z",
    buy_signals: [], sell_signals: [], exit_rules: {}, next_candle_execution: false,
    percent_return: 0, percent_return_adj: 0, period_return: 0, period_return_adj: 0, period_return_before_costs: 0,
    annualized_is_extrapolated: false, trade_cost_percent: 0.1, trades: 0, sharpe_ratio: 0, sharpe_ratio_adj: 0,
    sortino_ratio: 0, sortino_ratio_adj: 0,
    result: [{ datetime: "2025-01-01T00:00:00Z", close: 100, owned: 0, return: 100, exit_reason: "" }],
    ...extra,
  }) as unknown as SavedBacktestDetailData;

  it("carries the numbers when the server sent them", () => {
    const backtest = Backtest.fromSaved(detail({ max_drawdown: -5, closed_trades: 1, winning_trades: 1, win_rate: 100, time_invested: 40, open_trade: false }));
    expect(backtest.plain?.maxDrawdown).toBe(-5);
    expect(backtest.plain?.winRate).toBe(100);
  });

  it("has none for a run saved before they existed", () => {
    expect(Backtest.fromSaved(detail()).plain).toBeNull();
  });
});
