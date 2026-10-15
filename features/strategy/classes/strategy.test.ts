import { Backtest, BacktestResponseDataFormat } from "./Backtest";
import { Signal, SignalData } from "./Signal";
import { Strategy, StrategyData } from "./Strategy";
import { Trade } from "./Trade";
import { defaultParams, IndicatorName, indicators } from "../enums/Indicator";

// The API expects these exact keys for every signal (the `Signal` dataclass in AlgoTrackerBackend's
// api/indicators/signal.py) and recognises exactly these indicator names (api/services/signal_service.py).
// A typo on either side would make the backend reject or silently misread a strategy, so they are pinned here.
const BACKEND_SIGNAL_KEYS = [
  "above_target", "buy_signal", "fast_window", "name", "signal_window", "slow_window", "target_value", "window",
];
const BACKEND_INDICATOR_NAMES = ["ADX", "BBP", "EMA", "MACD", "RSI", "SMA", "SO"];

const indicator = (name: IndicatorName) => indicators.find(i => i.name === name)!;

const rsiSignal = (target: number, aboveTarget: boolean) =>
  new Signal(indicator(IndicatorName.rsi), target, aboveTarget, 14, null, null, null);

const macdSignal = () => new Signal(indicator(IndicatorName.macd), 1, true, null, 12, 26, 9);

const makeStrategy = (buy: Signal[] = [rsiSignal(30, false)], sell: Signal[] = [rsiSignal(70, true)]) =>
  new Strategy(1, "Mean reversion", "AAPL", "1day", buy, sell);

describe("indicators", () => {
  it("are exactly the names the backend recognises", () => {
    expect(Object.values(IndicatorName).sort()).toEqual(BACKEND_INDICATOR_NAMES);
    expect(indicators.map(i => i.name).sort()).toEqual(BACKEND_INDICATOR_NAMES);
  });

  it("each have default parameters, with MACD using three windows and the rest one", () => {
    for (const { name } of indicators) {
      const params = defaultParams[name];
      expect(params).toBeDefined();
      expect(typeof params.targetValue).toBe("number");
      if (name === IndicatorName.macd) {
        expect(params.Window).toBeNull();
        expect([params["Fast Window"], params["Slow Window"], params["Signal Window"]]).toEqual([12, 26, 9]);
      } else {
        expect(typeof params.Window).toBe("number");
        expect(params["Fast Window"] ?? params["Slow Window"] ?? params["Signal Window"]).toBeNull();
      }
    }
  });
});

describe("Signal", () => {
  it("serialises to exactly the fields the backend expects, flagged buy or sell", () => {
    const buy = rsiSignal(30, false).toJSON(true);
    const sell = rsiSignal(70, true).toJSON(false);
    expect(Object.keys(buy).sort()).toEqual(BACKEND_SIGNAL_KEYS);
    expect(buy).toEqual({
      name: "RSI", above_target: false, buy_signal: true, target_value: 30,
      window: 14, fast_window: null, slow_window: null, signal_window: null,
    });
    expect(sell.buy_signal).toBe(false);
    expect(sell.above_target).toBe(true);
  });

  it("sends MACD's three windows and no single window", () => {
    expect(macdSignal().toJSON(true)).toMatchObject({
      name: "MACD", window: null, fast_window: 12, slow_window: 26, signal_window: 9,
    });
  });

  it("is rebuilt from the API's snake_case data", () => {
    const data: SignalData = {
      name: "MACD", target_value: 1, above_target: true,
      window: null, fast_window: 12, slow_window: 26, signal_window: 9,
    };
    const signal = Signal.fromData(data);
    expect(signal.indicator).toBe(indicator(IndicatorName.macd));
    expect([signal.fastWindow, signal.slowWindow, signal.signalWindow]).toEqual([12, 26, 9]);
    expect(signal.aboveTarget).toBe(true);
  });

  it("rejects an indicator it does not know, rather than building a half-valid strategy", () => {
    const data = { name: "CCI", target_value: 0, above_target: true, window: 14,
      fast_window: null, slow_window: null, signal_window: null } as unknown as SignalData;
    expect(() => Signal.fromData(data)).toThrow("Invalid indicator value: CCI");
  });
});

describe("request bodies", () => {
  it("subscribe: lists buy signals first, then sell signals, each flagged for its side", () => {
    const body = JSON.parse(makeStrategy([rsiSignal(30, false), macdSignal()], [rsiSignal(70, true)]).toSubscribeJSON());
    expect(body).toMatchObject({ symbol: "AAPL", title: "Mean reversion", interval: "1day" });
    expect(body.signals.map((s: any) => [s.name, s.buy_signal])).toEqual([["RSI", true], ["MACD", true], ["RSI", false]]);
  });

  it("backtest: sends the symbol, interval, ISO date range and signals, but no title", () => {
    const backtest = new Backtest(makeStrategy(), new Date("2025-01-01T00:00:00Z"), new Date("2025-12-31T00:00:00Z"));
    const body = JSON.parse(backtest.toRequestJSON());
    expect(body).toMatchObject({
      symbol: "AAPL", interval: "1day",
      start_date: "2025-01-01T00:00:00.000Z", end_date: "2025-12-31T00:00:00.000Z",
    });
    expect(body.signals).toHaveLength(2);
    expect(body).not.toHaveProperty("title");
  });
});

describe("Backtest.updateFromData", () => {
  const bar = (day: number, close: number, owned: number, extra: object = {}) => ({
    datetime: `2025-03-${String(day).padStart(2, "0")}T00:00:00Z`, close, buy: false, sell: false, owned, return: 1, ...extra,
  });
  const response = (result: any[]): BacktestResponseDataFormat => ({
    result, image: "img", image_no_signals: "img2",
    percent_return: 12.5, percent_return_adj: 10, sharpe_ratio: 1.2, sharpe_ratio_adj: 1.1,
    sortino_ratio: 1.8, sortino_ratio_adj: 1.6, user_account_credits: 40, user_monthly_credits: 460,
  });
  const newBacktest = () => new Backtest(makeStrategy(), new Date("2025-03-01"), new Date("2025-03-31"));

  it("derives the trade list from changes in the owned flag", () => {
    const backtest = newBacktest().updateFromData(response([
      bar(1, 100, 0), bar(2, 101, 1), bar(3, 105, 1), bar(4, 103, 0), bar(5, 99, 1),
    ]));
    expect(backtest.strategy.trades.map(t => [t.isBuy, t.price, t.date.toISOString().slice(0, 10)])).toEqual([
      [true, 101, "2025-03-02"], [false, 103, "2025-03-04"], [true, 99, "2025-03-05"],
    ]);
    expect(backtest.strategy.trades[0]).toBeInstanceOf(Trade);
  });

  it("makes no trades when the strategy never held the asset, and copes with no data at all", () => {
    expect(newBacktest().updateFromData(response([bar(1, 100, 0), bar(2, 101, 0)])).strategy.trades).toEqual([]);
    const empty = newBacktest().updateFromData(response([]));
    expect(empty.strategy.trades).toEqual([]);
    expect(empty.stockValues).toEqual([]);
    expect(empty.percentReturn).toBe(12.5);
  });

  it("builds the price and return series and copies the performance figures", () => {
    const backtest = newBacktest().updateFromData(response([
      bar(1, 100, 0, { return: 1 }), bar(2, 110, 1, { return: 1.1 }),
    ]));
    expect(backtest.stockValues.map(v => [v.symbol, v.price])).toEqual([["AAPL", 100], ["AAPL", 110]]);
    expect(backtest.returnValues.map(v => v.returnValue)).toEqual([1, 1.1]);
    expect([backtest.percentReturn, backtest.sharpeRatio, backtest.sortinoRatio]).toEqual([12.5, 1.2, 1.8]);
    expect([backtest.percentReturnAdj, backtest.sharpeRatioAdj, backtest.sortinoRatioAdj]).toEqual([10, 1.1, 1.6]);
    expect([backtest.resultImage, backtest.resultImageNoSignals]).toEqual(["img", "img2"]);
  });

  it("collects each indicator's values as its own series", () => {
    const backtest = newBacktest().updateFromData(response([
      bar(1, 100, 0, { indicators: { RSI_14: 40, SMA_20: 99 } }),
      bar(2, 101, 0, { indicators: { RSI_14: 55, SMA_20: 99.5 } }),
    ]));
    expect(Object.keys(backtest.indicatorValues).sort()).toEqual(["RSI_14", "SMA_20"]);
    expect(backtest.indicatorValues.RSI_14).toHaveLength(2);
  });
});

describe("Strategy.fromData", () => {
  it("rebuilds signals and trades from the API's snake_case data", () => {
    const data: StrategyData = {
      id: 7, title: "Trend", symbol: "BTC/USD", interval: "1day",
      buy_signals: [{ name: "RSI", target_value: 30, above_target: false, window: 14,
        fast_window: null, slow_window: null, signal_window: null }],
      sell_signals: [{ name: "ADX", target_value: 50, above_target: true, window: 14,
        fast_window: null, slow_window: null, signal_window: null }],
      trades: [{ date: "2025-02-01T00:00:00Z", price: 42000, is_buy: true }],
      strategy_return: 1.2, asset_return: 1.1, position: 2,
      charge_user_date: "2025-06-01T00:00:00Z", active: true,
    };
    const strategy = Strategy.fromData(data);
    expect(strategy.buySignals[0].indicator.name).toBe(IndicatorName.rsi);
    expect(strategy.sellSignals[0].indicator.name).toBe(IndicatorName.adx);
    expect(strategy.trades[0]).toMatchObject({ price: 42000, isBuy: true });
    expect(strategy.trades[0].date).toEqual(new Date("2025-02-01T00:00:00Z"));
    expect([strategy.strategyReturn, strategy.assetReturn, strategy.position]).toEqual([1.2, 1.1, 2]);
  });
});

// The backend's charge_user_date is already the next charge date (api/models.py: it defaults to now + 30 days and is
// reset to now + 30 days on renewal; a charge is due once now passes it). The strategy screen counts down to it, so
// it must be shown as received.
describe("Strategy.chargeUserDate", () => {
  const SERVER_DATE = "2025-06-01T00:00:00Z";
  const fromServer = () => Strategy.fromData({
    id: 1, title: "t", symbol: "AAPL", interval: "1day", buy_signals: [], sell_signals: [], trades: [],
    strategy_return: 1, asset_return: 1, position: 1, charge_user_date: SERVER_DATE, active: true,
  });

  it("is kept exactly as the server sent it", () => {
    expect(fromServer().chargeUserDate).toEqual(new Date(SERVER_DATE));
  });

  it("does not change the Date it is given", () => {
    const given = new Date(SERVER_DATE);
    new Strategy(1, "t", "AAPL", "1day", [], [], [], 1, 1, 1, given);
    expect(given).toEqual(new Date(SERVER_DATE));
  });

  it("defaults to 30 days from now for a strategy that has not been charged yet", () => {
    const before = Date.now();
    const strategy = makeStrategy();
    const days = (strategy.chargeUserDate.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.99);
    expect(days).toBeLessThan(30.01);
  });
});
