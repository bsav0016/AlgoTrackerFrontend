import { PanResponder, PanResponderInstance } from "react-native";

/** A drag has to travel this far vertically before it can count as a scroll, so a small wobble never lets go of a scrub. */
export const SCROLL_SLOP = 8;
/** ...and this many times further up or down than sideways. */
export const SCROLL_RATIO = 1.5;

/**
 * Whether a drag (`dx`, `dy` in pixels since the touch began) is the page being scrolled rather than a finger
 * reading the chart. A chart is a wide strip that a thumb often lands on while scrolling; reading it means moving
 * sideways, so a drag that is mostly vertical belongs to the page.
 */
export function isScrollGesture(dx: number, dy: number): boolean {
    return Math.abs(dy) > SCROLL_SLOP && Math.abs(dy) > Math.abs(dx) * SCROLL_RATIO;
}

interface ScrubOptions {
    /** A finger is on the chart at `x` (pixels from the chart's left edge): show the reading there. */
    scrubTo: (x: number) => void;
    /** The finger left the chart, or the page took the gesture: go back to the resting reading. */
    end: () => void;
}

/**
 * The touch handling shared by every chart. Touching or dragging sideways reads the chart. Dragging mostly up or
 * down hands the gesture back to the page, which scrolls; the reading clears when it does.
 */
export function createScrubResponder({ scrubTo, end }: ScrubOptions): PanResponderInstance {
    return PanResponder.create({
        onStartShouldSetPanResponder: () => true, // a touch alone shows the reading under the finger
        onMoveShouldSetPanResponder: (_event, gesture) => !isScrollGesture(gesture.dx, gesture.dy),
        onPanResponderTerminationRequest: (_event, gesture) => isScrollGesture(gesture.dx, gesture.dy),
        onShouldBlockNativeResponder: () => false, // lets the scroll view take a vertical drag
        onPanResponderGrant: (event) => scrubTo(event.nativeEvent.locationX),
        onPanResponderMove: (event, gesture) => {
            if (!isScrollGesture(gesture.dx, gesture.dy)) scrubTo(event.nativeEvent.locationX);
        },
        onPanResponderRelease: end,
        onPanResponderTerminate: end,
    });
}
