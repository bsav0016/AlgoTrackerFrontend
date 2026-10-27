import React from "react";
import { act, create, ReactTestInstance } from "react-test-renderer";
import { Text } from "react-native";
import { CountdownTimer } from "./CountdownTimer";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();
const at = (secondsFromNow: number) => new Date(NOW + secondsFromNow * 1000);

const textOf = (node: ReactTestInstance | string): string =>
  typeof node === "string" ? node : node.children.map(textOf).join("");

function setup(endsAt: Date, whenZero?: () => Promise<void>) {
  let tree!: ReturnType<typeof create>;
  const element = (end: Date, callback = whenZero) => (
    <CountdownTimer key={end.getTime()} endsAt={end} whenZero={callback} />
  );
  act(() => {
    tree = create(element(endsAt));
  });
  const shown = () => textOf(tree.root.findAllByType(Text)[0]);
  const advance = (seconds: number) => act(() => { jest.advanceTimersByTime(seconds * 1000); });
  const changeEnd = (end: Date) => act(() => { tree.update(element(end)); });
  return { shown, advance, changeEnd };
}

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => jest.useRealTimers());

  it("shows the time left until the end date", () => {
    expect(setup(at(5)).shown()).toBe("0d 0:00:05");
    expect(setup(at(90_061)).shown()).toBe("1d 1:01:01");
  });

  it("counts down second by second", () => {
    const { shown, advance } = setup(at(5));
    advance(2);
    expect(shown()).toBe("0d 0:00:03");
    advance(1);
    expect(shown()).toBe("0d 0:00:02");
  });

  it("stays right if the phone's timers run late, because it reads the clock each tick", () => {
    const { shown } = setup(at(60));
    act(() => { jest.setSystemTime(NOW + 45_000); jest.advanceTimersByTime(1000); });
    expect(shown()).toBe("0d 0:00:14");
  });

  it("calls whenZero once when it reaches zero and then stops", () => {
    const whenZero = jest.fn(() => Promise.resolve());
    const { shown, advance } = setup(at(3), whenZero);
    advance(2);
    expect(whenZero).not.toHaveBeenCalled();
    advance(1);
    expect(shown()).toBe("0d 0:00:00");
    expect(whenZero).toHaveBeenCalledTimes(1);
    advance(10);
    expect(whenZero).toHaveBeenCalledTimes(1);
    expect(shown()).toBe("0d 0:00:00");
  });

  it("calls whenZero on the first tick if the date has already passed", () => {
    const whenZero = jest.fn(() => Promise.resolve());
    const { shown, advance } = setup(at(-30), whenZero);
    advance(1);
    expect(shown()).toBe("0d 0:00:00");
    expect(whenZero).toHaveBeenCalledTimes(1);
  });

  it("starts a new count when it is given a new end date, even after it reached zero", () => {
    const whenZero = jest.fn(() => Promise.resolve());
    const { shown, advance, changeEnd } = setup(at(2), whenZero);
    advance(2);
    expect(shown()).toBe("0d 0:00:00");
    changeEnd(at(100));
    expect(shown()).toBe("0d 0:01:38");
    advance(3);
    expect(shown()).toBe("0d 0:01:35");
    expect(whenZero).toHaveBeenCalledTimes(1);
  });

  it("uses the latest whenZero it was given, not the one from when the count began", () => {
    const first = jest.fn(() => Promise.resolve());
    const second = jest.fn(() => Promise.resolve());
    let tree!: ReturnType<typeof create>;
    const end = at(3);
    act(() => {
      tree = create(<CountdownTimer key="a" endsAt={end} whenZero={first} />);
    });
    act(() => { tree.update(<CountdownTimer key="a" endsAt={end} whenZero={second} />); });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops its timer when it is removed", () => {
    const whenZero = jest.fn(() => Promise.resolve());
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<CountdownTimer endsAt={at(2)} whenZero={whenZero} />);
    });
    act(() => { tree.unmount(); });
    act(() => { jest.advanceTimersByTime(10_000); });
    expect(whenZero).not.toHaveBeenCalled();
  });
});
