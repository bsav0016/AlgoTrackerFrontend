import { User } from "./User";
import { Strategy } from "../strategy/classes/Strategy";
import { Signal } from "../strategy/classes/Signal";
import { Trade } from "../strategy/classes/Trade";
import { IndicatorName, indicators } from "../strategy/enums/Indicator";

const rsi = indicators.find(i => i.name === IndicatorName.rsi)!;

const makeUser = () => {
  const strategy = new Strategy(
    7,
    "Dip buyer",
    "AAPL",
    "1day",
    [new Signal(rsi, 40, false, 14, null, null, null)],
    [new Signal(rsi, 60, true, 14, null, null, null)],
    [new Trade(new Date("2026-03-02T00:00:00.000Z"), 181.36, true)],
    1.25,
    1.1,
    2,
    new Date("2026-11-01T12:00:00.000Z"),
    true
  );
  return new User(
    "demo", "Alex", "Demo", "demo@example.com",
    new Date("2026-01-05T09:30:00.000Z"),
    [strategy],
    250, 407,
    new Date("2026-11-16T08:00:00.000Z"),
    "Quiet Trader"
  );
};

// UserProvider keeps the user in AsyncStorage as JSON, which turns every Date into a string. Screens call .getTime()
// and friends on those dates before the first refresh from the server, so what comes back has to be real Dates.
describe("User.fromStored", () => {
  const restored = User.fromStored(JSON.parse(JSON.stringify(makeUser())));

  it("restores the user's dates as Date objects", () => {
    expect(restored.resetMonthlyCredits).toBeInstanceOf(Date);
    expect(restored.resetMonthlyCredits.getTime()).toBe(new Date("2026-11-16T08:00:00.000Z").getTime());
    expect(restored.accountCreated).toBeInstanceOf(Date);
  });

  it("keeps the leaderboard name, and treats a missing one as off", () => {
    expect(restored.leaderboardName).toBe("Quiet Trader");
    const { leaderboardName, ...older } = JSON.parse(JSON.stringify(makeUser()));
    expect(leaderboardName).toBe("Quiet Trader");
    expect(User.fromStored(older).leaderboardName).toBeNull();
  });

  it("keeps the plain fields", () => {
    expect([restored.username, restored.firstName, restored.lastName, restored.email])
      .toEqual(["demo", "Alex", "Demo", "demo@example.com"]);
    expect([restored.accountCredits, restored.monthlyCredits]).toEqual([250, 407]);
  });

  it("restores strategies as Strategy objects with real dates, trades and signals", () => {
    const [strategy] = restored.strategies;
    expect(strategy).toBeInstanceOf(Strategy);
    expect(strategy.chargeUserDate).toBeInstanceOf(Date);
    expect(strategy.chargeUserDate.getTime()).toBe(new Date("2026-11-01T12:00:00.000Z").getTime());
    expect([strategy.title, strategy.symbol, strategy.interval, strategy.position]).toEqual(["Dip buyer", "AAPL", "1day", 2]);
    expect([strategy.strategyReturn, strategy.assetReturn]).toEqual([1.25, 1.1]);

    expect(strategy.trades).toHaveLength(1);
    expect(strategy.trades[0]).toBeInstanceOf(Trade);
    expect(strategy.trades[0].date).toBeInstanceOf(Date);
    expect([strategy.trades[0].price, strategy.trades[0].isBuy]).toEqual([181.36, true]);

    expect(strategy.buySignals[0]).toBeInstanceOf(Signal);
    expect(strategy.buySignals[0].indicator.name).toBe(IndicatorName.rsi);
    expect([strategy.buySignals[0].targetValue, strategy.buySignals[0].aboveTarget]).toEqual([40, false]);
    expect([strategy.sellSignals[0].targetValue, strategy.sellSignals[0].aboveTarget]).toEqual([60, true]);
  });

  it("does not move the charge date when restoring (the constructor must not add days to a stored date)", () => {
    const original = makeUser().strategies[0].chargeUserDate.getTime();
    expect(restored.strategies[0].chargeUserDate.getTime()).toBe(original);
  });

  it("copes with a stored user that has no strategies", () => {
    const stored = JSON.parse(JSON.stringify(makeUser()));
    delete stored.strategies;
    expect(User.fromStored(stored).strategies).toEqual([]);
  });
});
