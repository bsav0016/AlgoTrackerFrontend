import { Signal } from "./classes/Signal";
import { Strategy } from "./classes/Strategy";
import { Trade } from "./classes/Trade";
import { indicators } from "./enums/Indicator";

const signals: Signal[] = [
    new Signal(
        indicators[0],
        30,
        false,
        14,
        null,
        null,
        null
    ),

    new Signal(
        indicators[0],
        70,
        false,
        14,
        null,
        null,
        null
    )
]

const trades: Trade[] = [
    new Trade(
        new Date(Date.now()),
        500.05,
        true
    ),

    new Trade(
        new Date(2024, 0, 1),
        135.5,
        false
    )
]

export const TestStrategies = [
    new Strategy(
        -1,
        'Title 1',
        'AAPL',
        '1h',
        [signals[0]],
        [signals[1]],
        trades,
        1.06,
        0.98,
        0
    ),

    new Strategy(
        -1,
        'Title 2',
        'AAPL',
        '1h',
        [signals[1]],
        [signals[0]],
        trades,
        1.06,
        0.98,
        1
    ),

    new Strategy(
        -1,
        'Title 1',
        'AAPL',
        '1h',
        [signals[0]],
        [signals[1]],
        trades,
        1.06,
        0.98,
        3
    ),

    new Strategy(
        -1,
        'Title 2',
        'AAPL',
        '1h',
        [signals[1]],
        [signals[0]],
        trades,
        1.06,
        0.98,
        2
    )
]