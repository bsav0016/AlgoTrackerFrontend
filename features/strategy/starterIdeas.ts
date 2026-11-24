import { EMPTY_EXIT_RULE_INPUTS, ExitRuleInputs } from "./classes/ExitRules";
import { CURRENT_SIGNAL_VERSION, Signal } from "./classes/Signal";
import { DEFAULT_FAST_WINDOW, DEFAULT_SLOW_WINDOW, IndicatorName, indicators } from "./enums/Indicator";

/**
 * Ready-made starting points for the builder. They are ideas to learn from, not recommendations: choosing one only
 * fills in the signals and exit rules, which can all be changed, and the symbol, candle interval and dates are still
 * the user's. The wording below is the only place the app describes them, so it is kept plain and makes no claim about
 * how an idea will do.
 */
export interface StarterIdea {
    id: string;
    name: string;
    /** One line shown on the button. */
    summary: string;
    /** What the idea does and why, in everyday words, shown once it is chosen. */
    howItWorks: string;
    build: () => { buySignals: Signal[]; sellSignals: Signal[]; exitRuleInputs: ExitRuleInputs };
}

export const STARTER_DISCLAIMER =
    "These are ideas to learn from, not recommendations. Run a backtest to see how one behaved in the past. "
    + "Past results are not a prediction of future results, and this is not financial advice.";

const indicator = (name: IndicatorName) => {
    const found = indicators.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`Unknown indicator ${name}`);
    return found;
};

const single = (name: IndicatorName, target: number, aboveTarget: boolean, window: number) =>
    new Signal(indicator(name), target, aboveTarget, window, null, null, null);

const averageCrossover = (aboveTarget: boolean) =>
    new Signal(
        indicator(IndicatorName.smaPrice), 0, aboveTarget, DEFAULT_FAST_WINDOW, null, null, null, CURRENT_SIGNAL_VERSION,
        { indicator: indicator(IndicatorName.smaPrice), window: DEFAULT_SLOW_WINDOW },
    );

const trend = () => ({
    buySignals: [single(IndicatorName.sma, 1, false, 50)], // average / price below 1: the price is above its average
    sellSignals: [single(IndicatorName.sma, 1, true, 50)],
});

export const STARTER_IDEAS: StarterIdea[] = [
    {
        id: "rsi-bounce",
        name: "RSI bounce",
        summary: "Buy after a fall, sell after a rise",
        howItWorks:
            "RSI measures how fast the price has moved lately, on a scale from 0 to 100. Below 40 means it has been falling; "
            + "above 60 means it has been rising. This idea buys when RSI (14) drops below 40 and sells when it rises above 60.",
        build: () => ({
            buySignals: [single(IndicatorName.rsi, 40, false, 14)],
            sellSignals: [single(IndicatorName.rsi, 60, true, 14)],
            exitRuleInputs: { ...EMPTY_EXIT_RULE_INPUTS },
        }),
    },
    {
        id: "bollinger-bounce",
        name: "Bollinger bounce",
        summary: "Buy near the bottom of the usual range",
        howItWorks:
            "Percent B shows where the price sits inside its recent range: 0 is the bottom edge and 1 the top. "
            + "This idea buys when Percent B (20) falls below 0.1, near the bottom, and sells when it is back above 0.5, the middle.",
        build: () => ({
            buySignals: [single(IndicatorName.bbp, 0.1, false, 20)],
            sellSignals: [single(IndicatorName.bbp, 0.5, true, 20)],
            exitRuleInputs: { ...EMPTY_EXIT_RULE_INPUTS },
        }),
    },
    {
        id: "trend",
        name: "Follow the trend",
        summary: "Stay in while the price is above its average",
        howItWorks:
            "When the price is above its recent average, the trend is up. This idea buys when the price is above its 50-candle "
            + "average and sells when it falls below. In the builder this reads as \"SMA/Current Price below 1\": the average "
            + "divided by the price, so below 1 means the price is above its average. It can trade often, and many of its trades "
            + "may lose a little.",
        build: () => ({ ...trend(), exitRuleInputs: { ...EMPTY_EXIT_RULE_INPUTS } }),
    },
    {
        id: "trend-trailing-stop",
        name: "Trend with a trailing stop",
        summary: "The same, and sell early on a 5% slide",
        howItWorks:
            "The same trend idea, plus a 5% trailing stop: it also sells early if the price falls 5% below its highest point "
            + "since the buy, even while the price is still above its average.",
        build: () => ({ ...trend(), exitRuleInputs: { ...EMPTY_EXIT_RULE_INPUTS, trailing_stop: "5" } }),
    },
    {
        id: "average-crossover",
        name: "Moving-average crossover",
        summary: "Buy when a fast average rises above a slow one",
        howItWorks:
            "A moving average smooths the price over a number of candles. A fast one (20 candles) follows the price closely and a "
            + "slow one (50 candles) follows it loosely. When the fast average rises above the slow one, the price has been climbing "
            + "lately. This idea buys then, and sells when the fast average falls back below the slow one. Because averages look "
            + "back, it tends to buy and sell after the price has already turned.",
        build: () => ({
            buySignals: [averageCrossover(true)],
            sellSignals: [averageCrossover(false)],
            exitRuleInputs: { ...EMPTY_EXIT_RULE_INPUTS },
        }),
    },
];
