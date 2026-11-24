import { Backtest } from "./classes/Backtest";
import { parseExitRules } from "./classes/ExitRules";
import { CURRENT_SIGNAL_VERSION } from "./classes/Signal";
import { Strategy } from "./classes/Strategy";
import { IndicatorName } from "./enums/Indicator";
import { STARTER_DISCLAIMER, STARTER_IDEAS } from "./starterIdeas";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/" } } },
}));

// What the server accepts (SignalSerializer in AlgoTrackerBackend): known indicators, a window of 1 to 500, a finite target.
const SERVER_INDICATORS = ["RSI", "SMA", "EMA", "MACD", "SO", "BBP", "ADX", "SMA_PRICE", "EMA_PRICE"];

describe("the starter ideas", () => {
  it("are five, each with a unique id, a name, a one-line summary and an explanation", () => {
    expect(STARTER_IDEAS.map((idea) => idea.id)).toEqual(["rsi-bounce", "bollinger-bounce", "trend", "trend-trailing-stop", "average-crossover"]);
    expect(new Set(STARTER_IDEAS.map((idea) => idea.id)).size).toBe(5);
    for (const idea of STARTER_IDEAS) {
      expect(idea.name.length).toBeGreaterThan(0);
      expect(idea.summary.length).toBeGreaterThan(0);
      expect(idea.howItWorks.length).toBeGreaterThan(40);
    }
  });

  it("each build a buy rule and a sell rule the server will accept", () => {
    for (const idea of STARTER_IDEAS) {
      const { buySignals, sellSignals } = idea.build();
      expect(buySignals.length).toBeGreaterThan(0);
      expect(sellSignals.length).toBeGreaterThan(0);
      for (const signal of [...buySignals, ...sellSignals]) {
        expect(SERVER_INDICATORS).toContain(signal.indicator.name);
        expect(Number.isFinite(signal.targetValue)).toBe(true);
        expect(signal.window).toBeGreaterThanOrEqual(1);
        expect(signal.window).toBeLessThanOrEqual(500);
        if (signal.compareTo) {
          // SignalSerializer: only price averages can be compared, with a window of 1 to 500, never with themselves.
          expect(["SMA_PRICE", "EMA_PRICE"]).toContain(signal.indicator.name);
          expect(["SMA_PRICE", "EMA_PRICE"]).toContain(signal.compareTo.indicator.name);
          expect(signal.compareTo.window).toBeGreaterThanOrEqual(1);
          expect(signal.compareTo.window).toBeLessThanOrEqual(500);
          expect(signal.compareTo.window === signal.window && signal.compareTo.indicator.name === signal.indicator.name).toBe(false);
        }
        expect(signal.version).toBe(CURRENT_SIGNAL_VERSION);
      }
    }
  });

  it("buy and sell on opposite sides of the same indicator, so each can actually switch on and off", () => {
    for (const idea of STARTER_IDEAS) {
      const { buySignals, sellSignals } = idea.build();
      expect(buySignals[0].indicator.name).toBe(sellSignals[0].indicator.name);
      expect(buySignals[0].aboveTarget).not.toBe(sellSignals[0].aboveTarget);
    }
  });

  it("have the settings the explanations describe", () => {
    const byId = Object.fromEntries(STARTER_IDEAS.map((idea) => [idea.id, idea.build()]));
    const read = (signals: ReturnType<typeof STARTER_IDEAS[0]["build"]>["buySignals"]) =>
      signals.map((s) => [s.indicator.name, s.aboveTarget, s.targetValue, s.window]);
    expect(read(byId["rsi-bounce"].buySignals)).toEqual([[IndicatorName.rsi, false, 40, 14]]);
    expect(read(byId["rsi-bounce"].sellSignals)).toEqual([[IndicatorName.rsi, true, 60, 14]]);
    expect(read(byId["bollinger-bounce"].buySignals)).toEqual([[IndicatorName.bbp, false, 0.1, 20]]);
    expect(read(byId["bollinger-bounce"].sellSignals)).toEqual([[IndicatorName.bbp, true, 0.5, 20]]);
    expect(read(byId["trend"].buySignals)).toEqual([[IndicatorName.sma, false, 1, 50]]);
    expect(read(byId["trend"].sellSignals)).toEqual([[IndicatorName.sma, true, 1, 50]]);
    const cross = (signals: ReturnType<typeof STARTER_IDEAS[0]["build"]>["buySignals"]) =>
      signals.map((s) => [s.indicator.name, s.aboveTarget, s.window, s.compareTo?.indicator.name, s.compareTo?.window]);
    expect(cross(byId["average-crossover"].buySignals)).toEqual([[IndicatorName.smaPrice, true, 20, IndicatorName.smaPrice, 50]]);
    expect(cross(byId["average-crossover"].sellSignals)).toEqual([[IndicatorName.smaPrice, false, 20, IndicatorName.smaPrice, 50]]);
  });

  it("only the trailing-stop idea has an exit rule, and its boxes parse to 5 percent", () => {
    for (const idea of STARTER_IDEAS) {
      const parsed = parseExitRules(idea.build().exitRuleInputs);
      expect(parsed.error).toBeUndefined();
      expect(parsed.rules).toEqual(idea.id === "trend-trailing-stop" ? { trailing_stop: 5 } : {});
    }
  });

  it("give a fresh set of signals each time, so editing one cannot change the next pick", () => {
    const idea = STARTER_IDEAS[0];
    const first = idea.build();
    first.buySignals[0].targetValue = 5;
    first.sellSignals[0].window = 3;
    const second = idea.build();
    expect(second.buySignals[0].targetValue).toBe(40);
    expect(second.sellSignals[0].window).toBe(14);
    expect(second.buySignals[0]).not.toBe(first.buySignals[0]);
  });

  it("send the request the server expects when run as a backtest or subscribed", () => {
    for (const idea of STARTER_IDEAS) {
      const built = idea.build();
      const strategy = new Strategy(
        -1, "Idea", "AAPL", "1day", built.buySignals, built.sellSignals, [], 1, 1, 1, undefined, true, null,
        parseExitRules(built.exitRuleInputs).rules ?? {}
      );
      const body = JSON.parse(strategy.toSubscribeJSON());
      expect(body.signals.filter((s: { buy_signal: boolean }) => s.buy_signal).length).toBeGreaterThan(0);
      expect(body.signals.every((s: { version: number }) => s.version === CURRENT_SIGNAL_VERSION)).toBe(true);
      expect(body.exit_rules).toEqual(idea.id === "trend-trailing-stop" ? { trailing_stop: 5 } : undefined);

      const backtest = new Backtest(strategy, new Date("2025-01-01"), new Date("2025-12-31"));
      expect(JSON.parse(backtest.toRequestJSON()).signals).toHaveLength(body.signals.length);
    }
  });
});

describe("the wording", () => {
  const text = (idea: (typeof STARTER_IDEAS)[number]) => `${idea.name} ${idea.summary} ${idea.howItWorks}`.toLowerCase();

  it("promises nothing: no guarantees, no advice, no claims about results", () => {
    const forbidden = [
      "guarantee", "risk-free", "risk free", "recommend", "best", "beat the market", "will make", "will earn",
      "always", "never lose", "sure", "profitable", "winning strateg", "outperform",
    ];
    // Whole words only ("sure" must not match "measures").
    const mentions = (haystack: string, word: string) => new RegExp(`(^|[^a-z])${word}`).test(haystack)
      && (word.endsWith("strateg") || new RegExp(`${word}([^a-z]|$)`).test(haystack));
    for (const idea of STARTER_IDEAS) {
      for (const word of forbidden) {
        expect(`${word}: ${mentions(text(idea), word)}`).toBe(`${word}: false`);
      }
    }
  });

  it("says plainly what the idea does, including the numbers it uses", () => {
    expect(STARTER_IDEAS[0].howItWorks).toContain("below 40");
    expect(STARTER_IDEAS[0].howItWorks).toContain("above 60");
    expect(STARTER_IDEAS[1].howItWorks).toContain("0.1");
    expect(STARTER_IDEAS[1].howItWorks).toContain("0.5");
    expect(STARTER_IDEAS[2].howItWorks).toContain("50-candle");
    expect(STARTER_IDEAS[3].howItWorks).toContain("5%");
    expect(STARTER_IDEAS[4].howItWorks).toContain("20 candles");
    expect(STARTER_IDEAS[4].howItWorks).toContain("50 candles");
  });

  it("the crossover idea is sent to the server as a comparison, with no target number", () => {
    const { buySignals, sellSignals } = STARTER_IDEAS[4].build();
    expect(buySignals[0].toJSON(true)).toMatchObject({
      name: "SMA_PRICE", above_target: true, buy_signal: true, window: 20, target_value: 0,
      compare_to: { name: "SMA_PRICE", window: 50 },
    });
    expect(sellSignals[0].toJSON(false)).toMatchObject({ above_target: false, buy_signal: false, compare_to: { name: "SMA_PRICE", window: 50 } });
  });

  it("is honest about the trend idea: it can trade often and many trades may lose a little", () => {
    expect(STARTER_IDEAS[2].howItWorks).toContain("many of its trades may lose a little");
  });

  it("carries the disclaimer: ideas to learn from, past results do not predict, not advice", () => {
    expect(STARTER_DISCLAIMER).toContain("not recommendations");
    expect(STARTER_DISCLAIMER).toContain("Past results are not a prediction");
    expect(STARTER_DISCLAIMER).toContain("not financial advice");
  });
});
