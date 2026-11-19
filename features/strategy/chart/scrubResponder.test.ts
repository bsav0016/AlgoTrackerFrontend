import { PanResponder } from "react-native";
import { SCROLL_RATIO, SCROLL_SLOP, createScrubResponder, isScrollGesture } from "./scrubResponder";

describe("isScrollGesture", () => {
  it("is false for a touch that has not moved, and for a wobble inside the slop", () => {
    expect(isScrollGesture(0, 0)).toBe(false);
    expect(isScrollGesture(0, SCROLL_SLOP)).toBe(false);
    expect(isScrollGesture(2, -SCROLL_SLOP)).toBe(false);
  });

  it("is false for a sideways drag, even with some up or down wobble", () => {
    expect(isScrollGesture(60, 0)).toBe(false);
    expect(isScrollGesture(-60, 20)).toBe(false);
    expect(isScrollGesture(30, 40)).toBe(false); // more up than across, but not by enough
  });

  it("is true once the drag is clearly mostly vertical, up or down", () => {
    expect(isScrollGesture(0, 30)).toBe(true);
    expect(isScrollGesture(5, -40)).toBe(true);
    expect(isScrollGesture(20, 20 * SCROLL_RATIO + 1)).toBe(true);
    expect(isScrollGesture(20, 20 * SCROLL_RATIO)).toBe(false); // exactly the ratio is not past it
  });
});

describe("createScrubResponder", () => {
  const touch = (x: number) => ({ nativeEvent: { locationX: x } }) as never;
  const drag = (dx: number, dy: number) => ({ dx, dy }) as never;

  const setup = () => {
    const scrubTo = jest.fn();
    const end = jest.fn();
    const create = jest.spyOn(PanResponder, "create");
    createScrubResponder({ scrubTo, end });
    const config = create.mock.calls[0][0];
    create.mockRestore();
    return { config, scrubTo, end };
  };

  it("reads the chart as soon as a finger touches it", () => {
    const { config, scrubTo } = setup();
    expect(config.onStartShouldSetPanResponder?.(touch(40), drag(0, 0))).toBe(true);
    config.onPanResponderGrant?.(touch(40), drag(0, 0));
    expect(scrubTo).toHaveBeenCalledWith(40);
  });

  it("keeps reading while the finger moves sideways", () => {
    const { config, scrubTo } = setup();
    config.onPanResponderMove?.(touch(80), drag(40, 3));
    config.onPanResponderMove?.(touch(120), drag(80, -5));
    expect(scrubTo.mock.calls.map((call) => call[0])).toEqual([80, 120]);
  });

  it("stops reading once the drag turns into a scroll", () => {
    const { config, scrubTo } = setup();
    config.onPanResponderMove?.(touch(80), drag(2, 50));
    expect(scrubTo).not.toHaveBeenCalled();
  });

  it("lets the page take a vertical drag, and holds on to a sideways one", () => {
    const { config } = setup();
    expect(config.onPanResponderTerminationRequest?.(touch(0), drag(1, 40))).toBe(true);
    expect(config.onPanResponderTerminationRequest?.(touch(0), drag(40, 1))).toBe(false);
    expect(config.onPanResponderTerminationRequest?.(touch(0), drag(0, 0))).toBe(false);
  });

  it("does not claim a move that is already a scroll", () => {
    const { config } = setup();
    expect(config.onMoveShouldSetPanResponder?.(touch(0), drag(0, 40))).toBe(false);
    expect(config.onMoveShouldSetPanResponder?.(touch(0), drag(30, 2))).toBe(true);
  });

  it("does not block the native scroll view", () => {
    const { config } = setup();
    expect(config.onShouldBlockNativeResponder?.(touch(0), drag(0, 0))).toBe(false);
  });

  it("goes back to the resting reading when the finger lifts or the page takes the gesture", () => {
    const { config, end } = setup();
    config.onPanResponderRelease?.(touch(0), drag(0, 0));
    config.onPanResponderTerminate?.(touch(0), drag(0, 40));
    expect(end).toHaveBeenCalledTimes(2);
  });
});
