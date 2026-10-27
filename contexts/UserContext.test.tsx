import React from "react";
import { act, create } from "react-test-renderer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProvider, useUser } from "./UserContext";
import { User } from "@/features/auth/User";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

type Api = ReturnType<typeof useUser>;

const makeUser = (firstName = "Ada", accountCredits = 100) =>
  new User("ada", firstName, "Lovelace", "ada@example.com", new Date("2026-01-01"), [], accountCredits, 50, new Date("2026-02-01"));

async function setup() {
  let latest!: Api;
  let renders = 0;
  const Probe = () => {
    latest = useUser();
    renders += 1;
    return null;
  };
  await act(async () => {
    create(<UserProvider><Probe /></UserProvider>);
  });
  return { api: () => latest, renders: () => renders };
}

describe("UserContext", () => {
  beforeEach(() => AsyncStorage.clear());

  it("starts with no user", async () => {
    const { api } = await setup();
    expect(api().user).toBeNull();
    expect(api().userRef.current).toBeNull();
  });

  it("shows a new user as state, so a screen that renders it updates", async () => {
    const { api, renders } = await setup();
    const before = renders();
    await act(async () => { await api().setUser(makeUser()); });
    expect(api().user?.firstName).toBe("Ada");
    expect(renders()).toBeGreaterThan(before);
  });

  it("keeps the ref in step with the state, for handlers that run later", async () => {
    const { api } = await setup();
    await act(async () => { await api().setUser(makeUser()); });
    expect(api().userRef.current).toBe(api().user);
    await act(async () => { await api().setUser(null); });
    expect(api().user).toBeNull();
    expect(api().userRef.current).toBeNull();
  });

  it("saves the user for the next launch and forgets it on logout", async () => {
    const { api } = await setup();
    await act(async () => { await api().setUser(makeUser()); });
    expect(JSON.parse((await AsyncStorage.getItem("user"))!).firstName).toBe("Ada");
    await act(async () => { await api().setUser(null); });
    expect(await AsyncStorage.getItem("user")).toBeNull();
  });

  it("restores the saved user on start", async () => {
    await AsyncStorage.setItem("user", JSON.stringify(makeUser("Grace")));
    const { api } = await setup();
    expect(api().user?.firstName).toBe("Grace");
    expect(api().user?.resetMonthlyCredits).toBeInstanceOf(Date);
  });

  it("updates the credits on the current user and keeps everything else", async () => {
    const { api } = await setup();
    await act(async () => { await api().setUser(makeUser("Ada", 100)); });
    await act(async () => { api().updateAccountCredits(250, 40); });
    expect(api().user?.accountCredits).toBe(250);
    expect(api().user?.monthlyCredits).toBe(40);
    expect(api().user?.firstName).toBe("Ada");
    expect(api().user?.resetMonthlyCredits.toISOString()).toBe(new Date("2026-02-01").toISOString());
  });

  it("does nothing when credits are updated with nobody logged in", async () => {
    const { api } = await setup();
    await act(async () => { api().updateAccountCredits(250, 40); });
    expect(api().user).toBeNull();
  });
});
