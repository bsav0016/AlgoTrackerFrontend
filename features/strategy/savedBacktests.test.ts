import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { BacktestHistoryService, MAX_LABEL_LENGTH } from "./BacktestHistoryService";
import { Backtest, SavedBacktestDetailData } from "./classes/Backtest";
import { SavedBacktestItem, SavedBacktestItemData, SavedBacktestPage, appendPage } from "./SavedBacktest";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));

const request = networkRequest as jest.Mock;

const itemData = (id: number, overrides: Partial<SavedBacktestItemData> = {}): SavedBacktestItemData => ({
  id, created_at: "2026-11-17T12:00:00Z", label: "", symbol: "AAPL", interval: "1day",
  covered_start: "2025-11-18T00:00:00+00:00", covered_end: "2026-11-13T00:00:00+00:00",
  period_return: 23.9, trades: 25, has_exit_rules: false, ...overrides,
});

const detail = (): SavedBacktestDetailData => ({
  ...itemData(7, { label: "RSI with a stop", has_exit_rules: true }),
  id: 7, label: "RSI with a stop",
  requested_start: "2025-11-17T05:00:00Z", requested_end: "2026-11-16T05:00:00Z",
  buy_signals: [{ name: "RSI", above_target: false, target_value: 30, window: 14, fast_window: null, slow_window: null, signal_window: null, version: 2 }],
  sell_signals: [{ name: "RSI", above_target: true, target_value: 70, window: 14, fast_window: null, slow_window: null, signal_window: null, version: 2 }],
  exit_rules: { stop_loss: 5 },
  next_candle_execution: false,
  percent_return: 24.3, percent_return_adj: -9.5, period_return: 23.9, period_return_adj: -9.3,
  period_return_before_costs: 27.1, annualized_is_extrapolated: false, trade_cost_percent: 0.1, trades: 2,
  sharpe_ratio: 1.4, sharpe_ratio_adj: -0.5, sortino_ratio: 2.3, sortino_ratio_adj: -0.7,
  data_window: {
    requested_start: "2025-11-17T05:00:00Z", requested_end: "2026-11-16T05:00:00Z",
    covered_start: "2025-11-18T00:00:00+00:00", covered_end: "2025-11-21T00:00:00+00:00",
    candles: 4, requests: 1, truncated: false, reason: null,
  },
  result: [
    { datetime: "2025-11-18T00:00:00Z", close: 100, owned: 0, return: 100, exit_reason: "" },
    { datetime: "2025-11-19T00:00:00Z", close: 100, owned: 1, return: 100, exit_reason: "" },
    { datetime: "2025-11-20T00:00:00Z", close: 94, owned: 0, return: 94, exit_reason: "stop_loss" },
    { datetime: "2025-11-21T00:00:00Z", close: 95, owned: 0, return: 94, exit_reason: "" },
  ],
});

beforeEach(() => request.mockReset());

describe("a saved backtest in the list", () => {
  it("is named by the user if they named it, otherwise by its market", () => {
    expect(SavedBacktestItem.fromData(itemData(1)).title).toBe("AAPL · 1day");
    expect(SavedBacktestItem.fromData(itemData(1, { label: "My idea" })).title).toBe("My idea");
    expect(SavedBacktestItem.fromData(itemData(1, { label: "   " })).title).toBe("AAPL · 1day");
  });

  it("reads dates, the gain and whether it had exit rules, and copes with missing numbers", () => {
    const item = SavedBacktestItem.fromData(itemData(3, { has_exit_rules: true, period_return: null, trades: null }));
    expect(item.coveredStart.toISOString()).toBe("2025-11-18T00:00:00.000Z");
    expect(item.hasExitRules).toBe(true);
    expect(item.periodReturn).toBeNull();
    expect(item.trades).toBeNull();
  });

  it("appendPage keeps the order and ignores rows already shown", () => {
    const shown = [3, 2].map((id) => SavedBacktestItem.fromData(itemData(id)));
    const next = SavedBacktestPage.fromData({ results: [itemData(2), itemData(1)], next_before: null });
    expect(appendPage(shown, next).map((item) => item.id)).toEqual([3, 2, 1]);
  });
});

describe("BacktestHistoryService", () => {
  it("asks for a page with the cursor and parses the answer", async () => {
    request.mockResolvedValue({ data: { results: [itemData(5)], next_before: 4 } });
    const page = await BacktestHistoryService.list("access-1", 9, 20);
    expect(request).toHaveBeenCalledWith(
      "backtests/?limit=20&before=9", RequestMethod.GET,
      expect.objectContaining({ Authorization: expect.stringContaining("access-1") })
    );
    expect(page.items.map((item) => item.id)).toEqual([5]);
    expect(page.nextBefore).toBe(4);
  });

  it("asks for the first page without a cursor", async () => {
    request.mockResolvedValue({ data: { results: [], next_before: null } });
    await BacktestHistoryService.list("access-1");
    expect(request.mock.calls[0][0]).toBe("backtests/?limit=50");
  });

  it("opens a saved run as a backtest", async () => {
    request.mockResolvedValue({ data: detail() });
    const backtest = await BacktestHistoryService.open("access-1", 7);
    expect(request).toHaveBeenCalledWith("backtests/7/", RequestMethod.GET, expect.any(Object));
    expect(backtest).toBeInstanceOf(Backtest);
    expect(backtest.id).toBe(7);
  });

  it("renames with a trimmed label in a JSON PATCH", async () => {
    request.mockResolvedValue({ data: itemData(7, { label: "New name" }) });
    const updated = await BacktestHistoryService.rename("access-1", 7, "  New name  ");
    expect(request).toHaveBeenCalledWith(
      "backtests/7/", RequestMethod.PATCH,
      expect.objectContaining({ "Content-Type": "application/json", Authorization: expect.stringContaining("access-1") }),
      JSON.stringify({ label: "New name" })
    );
    expect(updated.title).toBe("New name");
  });

  it("deletes with a DELETE", async () => {
    request.mockResolvedValue({ data: null, status: 204 });
    await BacktestHistoryService.remove("access-1", 7);
    expect(request).toHaveBeenCalledWith("backtests/7/", RequestMethod.DELETE, expect.any(Object));
  });

  it("stops the name at the server's limit", () => {
    expect(MAX_LABEL_LENGTH).toBe(60);
  });
});

describe("a saved run reopened as a backtest", () => {
  it("has the request that made it, so it can be run again", () => {
    const backtest = Backtest.fromSaved(detail());
    expect(backtest.strategy.symbol).toBe("AAPL");
    expect(backtest.strategy.interval).toBe("1day");
    expect(backtest.strategy.buySignals.map((s) => [s.indicator.name, s.aboveTarget, s.targetValue])).toEqual([["RSI", false, 30]]);
    expect(backtest.strategy.sellSignals.map((s) => [s.indicator.name, s.aboveTarget, s.targetValue])).toEqual([["RSI", true, 70]]);
    expect(backtest.strategy.exitRules).toEqual({ stop_loss: 5 });
    expect(backtest.startDate.toISOString()).toBe("2025-11-17T05:00:00.000Z");
    const body = JSON.parse(backtest.toRequestJSON());
    expect(body.exit_rules).toEqual({ stop_loss: 5 });
    expect(body.signals).toHaveLength(2);
    expect(body.include_images).toBe(false);
  });

  it("knows it is saved, by what name and when", () => {
    const backtest = Backtest.fromSaved(detail());
    expect(backtest.id).toBe(7);
    expect(backtest.label).toBe("RSI with a stop");
    expect(backtest.savedAt?.toISOString()).toBe("2026-11-17T12:00:00.000Z");
  });

  it("reads back the same trades, exit reasons, chart points and numbers as a fresh run would show", () => {
    const backtest = Backtest.fromSaved(detail());
    expect(backtest.strategy.trades.map((t) => [t.isBuy, t.exitReason])).toEqual([[true, null], [false, "stop_loss"]]);
    expect(backtest.exitSummary).toBe("1 stop-loss exit");
    expect(backtest.chartPoints().map((p) => [p.price, p.value])).toEqual([[100, 100], [100, 100], [94, 94], [95, 94]]);
    expect(backtest.periodReturn).toBe(23.9);
    expect(backtest.periodReturnBeforeCosts).toBe(27.1);
    expect(backtest.tradeCount).toBe(2);
    expect(backtest.dataWindow?.candles).toBe(4);
    expect(backtest.resultImage).toBeNull();
  });

  it("a fresh run knows its id when the server sent one, and none when it did not", () => {
    const fresh = { ...detail(), id: 12 } as SavedBacktestDetailData;
    expect(Backtest.fromSaved(fresh).id).toBe(12);
    const unsaved = { ...detail(), id: null } as unknown as SavedBacktestDetailData;
    expect(Backtest.fromSaved(unsaved).id).toBeNull();
  });
});
