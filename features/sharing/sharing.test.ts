import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { SHARE_DISCLAIMER, isShareId, shareUrl, sharePayload } from "./ShareLink";
import { ShareService } from "./ShareService";
import { describeSignal, sharedStrategyFromData, SharedStrategyData } from "./SharedStrategy";
import { setPendingShare, takePendingShare } from "./pendingShare";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "https://api.test/" } } },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));
jest.mock("@/contexts/RouteContext", () => ({ useRouteTo: () => ({ routeTo: jest.fn() }) }));
jest.mock("@/contexts/UserContext", () => ({ useUser: () => ({ user: null }) }));

const request = networkRequest as jest.Mock;

const SHARED: SharedStrategyData = {
  title: "Momentum",
  symbol: "AAPL",
  interval: "1day",
  buy_signals: [{ name: "RSI", target_value: 30, above_target: false, window: 14, fast_window: null, slow_window: null, signal_window: null }],
  sell_signals: [{ name: "MACD", target_value: 1, above_target: true, window: null, fast_window: 12, slow_window: 26, signal_window: 9 }],
  strategy_return: "1.23180",
  asset_return: "0.94210",
};

const STRATEGY = {
  id: 7, title: "Momentum", symbol: "AAPL", interval: "1day", buy_signals: SHARED.buy_signals, sell_signals: SHARED.sell_signals,
  trades: [], strategy_return: 1, asset_return: 1, position: 1, charge_user_date: "2026-12-01T00:00:00Z", active: false,
  last_processed_ts: null,
};

beforeEach(() => jest.clearAllMocks());

describe("share links", () => {
  it("builds the address from the API's public address", () => {
    expect(shareUrl("abc_DEF-12345678")).toBe("https://api.test/s/abc_DEF-12345678");
  });

  it("accepts only ids shaped like the backend's", () => {
    expect(isShareId("abc_DEF-12345678901234")).toBe(true);
    for (const bad of ["", "short", "has space 12345", "../../etc/passwd", "a/b/c/d/e/f/g/h", "x".repeat(65), null, undefined, 12345678]) {
      expect(isShareId(bad)).toBe(false);
    }
  });

  it("keeps the link out of the text on iOS (it is its own item) and inside it on Android", () => {
    const ios = sharePayload("Momentum", "https://api.test/s/abc", "ios");
    expect(ios.url).toBe("https://api.test/s/abc");
    expect(ios.message).not.toContain("https://");
    const android = sharePayload("Momentum", "https://api.test/s/abc", "android");
    expect(android.url).toBeUndefined();
    expect(android.message).toContain("https://api.test/s/abc");
  });

  it("has a disclaimer that says results are not a prediction", () => {
    expect(SHARE_DISCLAIMER).toMatch(/not a prediction/i);
  });
});

describe("a shared strategy", () => {
  it("is read from the public data, with returns turned into numbers", () => {
    const shared = sharedStrategyFromData(SHARED);
    expect(shared.title).toBe("Momentum");
    expect(shared.strategyReturn).toBeCloseTo(1.2318);
    expect(shared.assetReturn).toBeCloseTo(0.9421);
    expect(shared.buySignals).toHaveLength(1);
  });

  it("describes rules in words", () => {
    const shared = sharedStrategyFromData(SHARED);
    expect(describeSignal(shared.buySignals[0])).toBe("RSI (14) is below 30");
    expect(describeSignal(shared.sellSignals[0])).toBe("MACD/Signal (12, 26, 9) is above 1");
  });

  it("refuses an indicator this version does not know instead of showing a broken rule", () => {
    expect(() => sharedStrategyFromData({ ...SHARED, buy_signals: [{ ...SHARED.buy_signals[0], name: "NEW" }] })).toThrow();
  });
});

describe("ShareService", () => {
  it("creates a share for the strategy with the user's token and returns its id", async () => {
    request.mockResolvedValue({ data: { share_id: "abc123456789" }, status: 201 });
    expect(await ShareService.createShare(7, "tok")).toBe("abc123456789");
    expect(request).toHaveBeenCalledWith("strategy/7/share/", RequestMethod.POST, { Authorization: "Bearer tok" });
  });

  it("turns a share off", async () => {
    request.mockResolvedValue({ data: null, status: 204 });
    await ShareService.revokeShare(7, "tok");
    expect(request).toHaveBeenCalledWith("strategy/7/share/", RequestMethod.DELETE, { Authorization: "Bearer tok" });
  });

  it("reads a shared strategy without sending any credentials", async () => {
    request.mockResolvedValue({ data: SHARED, status: 200 });
    const shared = await ShareService.getShared("abc123456789");
    expect(shared.symbol).toBe("AAPL");
    expect(request).toHaveBeenCalledWith("shared/abc123456789/", RequestMethod.GET);
  });

  it("clones into a draft the app can show", async () => {
    request.mockResolvedValue({ data: STRATEGY, status: 201 });
    const draft = await ShareService.cloneShared("abc123456789", "tok");
    expect(draft.id).toBe(7);
    expect(draft.active).toBe(false);
    expect(request).toHaveBeenCalledWith("shared/abc123456789/clone/", RequestMethod.POST, { Authorization: "Bearer tok" });
  });

  it("activates a draft", async () => {
    request.mockResolvedValue({ data: { ...STRATEGY, active: true }, status: 200 });
    const strategy = await ShareService.activate(7, "tok");
    expect(strategy.active).toBe(true);
    expect(request).toHaveBeenCalledWith("strategy/7/activate/", RequestMethod.POST, { Authorization: "Bearer tok" });
  });

  it("passes network errors on to the screen", async () => {
    request.mockRejectedValue(new Error("offline"));
    await expect(ShareService.getShared("abc123456789")).rejects.toThrow("offline");
  });
});

describe("a link that opens the app before sign-in", () => {
  beforeEach(() => takePendingShare());

  it("is kept until it is taken, then forgotten", () => {
    expect(setPendingShare("abc_DEF-12345678")).toBe(true);
    expect(takePendingShare()).toBe("abc_DEF-12345678");
    expect(takePendingShare()).toBeNull();
  });

  it("ignores an id that is not shaped like a share id", () => {
    expect(setPendingShare("../admin")).toBe(false);
    expect(setPendingShare(undefined)).toBe(false);
    expect(takePendingShare()).toBeNull();
  });
});
