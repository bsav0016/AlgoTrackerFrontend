import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { AuthService } from "@/features/auth/AuthService";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { NotificationEntry, NotificationHistoryPage, appendPage, strategyIdFromData } from "./NotificationEntry";
import { NotificationService } from "./NotificationService";
import { PUSH_TOKEN_KEY, getPushToken, registerPushToken, unregisterPushToken } from "./PushRegistration";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { API_URL: "http://api.test/", eas: { projectId: "project-1" } } } },
}));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: 5 },
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => void store.set(key, value)),
      removeItem: jest.fn(async (key: string) => void store.delete(key)),
    },
  };
});
jest.mock("@/features/auth/AuthService", () => ({
  AuthService: { addDeviceId: jest.fn(), deleteDeviceId: jest.fn() },
}));
jest.mock("@/lib/networkRequests/NetworkRequest", () => ({ networkRequest: jest.fn() }));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const auth = AuthService as jest.Mocked<typeof AuthService>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
  notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" } as never);
  notifications.getExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[abc]" } as never);
  auth.addDeviceId.mockResolvedValue(true);
  auth.deleteDeviceId.mockResolvedValue(true);
  return AsyncStorage.removeItem(PUSH_TOKEN_KEY);
});

describe("getPushToken", () => {
  it("returns the Expo token for this project when permission is already granted", async () => {
    expect(await getPushToken()).toBe("ExponentPushToken[abc]");
    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "project-1" });
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("asks for permission when it has not been granted, and gives no token if refused", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined" } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({ status: "denied" } as never);
    expect(await getPushToken()).toBeNull();
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when Expo fails", async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error("offline"));
    expect(await getPushToken()).toBeNull();
  });
});

describe("registerPushToken", () => {
  it("registers the token for the signed-in account and remembers it", async () => {
    expect(await registerPushToken("access-1")).toBe(true);
    expect(auth.addDeviceId).toHaveBeenCalledWith("access-1", "ExponentPushToken[abc]", expect.any(String));
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBe("ExponentPushToken[abc]");
  });

  it("registers again for the next account even though the token has not changed", async () => {
    await registerPushToken("access-alice");
    await registerPushToken("access-bob");
    expect(auth.addDeviceId).toHaveBeenCalledTimes(2);
    expect(auth.addDeviceId).toHaveBeenLastCalledWith("access-bob", "ExponentPushToken[abc]", expect.any(String));
  });

  it("does nothing when there is no token, and does not throw when the server refuses", async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: "denied" } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({ status: "denied" } as never);
    expect(await registerPushToken("access-1")).toBe(false);
    expect(auth.addDeviceId).not.toHaveBeenCalled();

    notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" } as never);
    auth.addDeviceId.mockRejectedValue(new Error("500"));
    expect(await registerPushToken("access-1")).toBe(false);
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });
});

describe("unregisterPushToken", () => {
  it("removes the remembered token from the account and forgets it", async () => {
    await registerPushToken("access-1");
    await unregisterPushToken("access-1");
    expect(auth.deleteDeviceId).toHaveBeenCalledWith("access-1", "ExponentPushToken[abc]");
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });

  it("does nothing when no token was registered", async () => {
    await unregisterPushToken("access-1");
    expect(auth.deleteDeviceId).not.toHaveBeenCalled();
  });

  it("still forgets the token, and does not throw, when the request fails", async () => {
    await registerPushToken("access-1");
    auth.deleteDeviceId.mockRejectedValue(new Error("offline"));
    await expect(unregisterPushToken("access-1")).resolves.toBeUndefined();
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });
});

const row = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  created_at: "2026-10-27T15:30:00Z",
  kind: "buy" as const,
  message: "Momentum triggered a buy signal!",
  strategy_id: 7,
  trade_id: 40 + id,
  price: "12.50",
  ...overrides,
});

describe("NotificationHistoryPage.fromData", () => {
  it("maps rows and keeps the paging cursor", () => {
    const page = NotificationHistoryPage.fromData({ results: [row(9), row(8, { kind: "sell" })], next_before: 8 });
    expect(page.nextBefore).toBe(8);
    const first = page.entries[0];
    expect(first).toBeInstanceOf(NotificationEntry);
    expect([first.id, first.kind, first.strategyId, first.tradeId, first.price]).toEqual([9, "buy", 7, 49, 12.5]);
    expect(first.createdAt.toISOString()).toBe("2026-10-27T15:30:00.000Z");
    expect(page.entries[1].kind).toBe("sell");
  });

  it("appendPage ignores rows already shown", () => {
    const shown = NotificationHistoryPage.fromData({ results: [row(3), row(2)], next_before: 2 }).entries;
    const next = NotificationHistoryPage.fromData({ results: [row(2), row(1)], next_before: null });
    expect(appendPage(shown, next).map((e) => e.id)).toEqual([3, 2, 1]);
  });
});

describe("strategyIdFromData", () => {
  it("reads the strategy id from a push's data", () => {
    expect(strategyIdFromData({ strategy_id: 7, trade_id: 3 })).toBe(7);
  });

  it("is null for anything that is not a whole-number id", () => {
    for (const data of [undefined, null, {}, { strategy_id: "7" }, { strategy_id: 1.5 }, { strategy_id: null }, "x"]) {
      expect(strategyIdFromData(data)).toBeNull();
    }
  });
});

describe("NotificationService.fetchHistory", () => {
  it("asks for a page with the cursor and parses the answer", async () => {
    (networkRequest as jest.Mock).mockResolvedValue({ data: { results: [row(5)], next_before: null } });
    const page = await NotificationService.fetchHistory("access-1", 9, 20);
    expect(networkRequest).toHaveBeenCalledWith(
      "notifications/?limit=20&before=9",
      RequestMethod.GET,
      expect.objectContaining({ Authorization: expect.stringContaining("access-1") })
    );
    expect(page.entries.map((e) => e.id)).toEqual([5]);
  });
});
