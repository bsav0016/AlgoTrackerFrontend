export interface IndicatorData {
    name: IndicatorName;
    displayName: string;
    /**
     * Averages on the price scale. They are used only by rules that compare two of them ("the 20-candle average is above
     * the 50-candle average"), so choosing one swaps the target number for a second average. The word is how a rule reads.
     */
    comparable?: boolean;
    averageWord?: string;
}

export enum IndicatorName {
    rsi = "RSI",
    sma = "SMA",
    ema = "EMA",
    macd = "MACD",
    so = "SO",
    bbp = "BBP",
    adx = "ADX",
    smaPrice = "SMA_PRICE",
    emaPrice = "EMA_PRICE"
}


export const targetValueString = "targetValue"
export const windowString = "Window";
export const fastWindowString = "Fast Window";
export const slowWindowString = "Slow Window";
export const signalWindowString = "Signal Window";

export const indicators: IndicatorData[] = [
    { name: IndicatorName.rsi, displayName: "RSI" },
    { name: IndicatorName.sma, displayName: "SMA/Current Price" },
    { name: IndicatorName.ema, displayName: "EMA/Current Price" },
    { name: IndicatorName.macd, displayName: "MACD/Signal" },
    { name: IndicatorName.so, displayName: "Stochastic Oscillator"},
    { name: IndicatorName.bbp, displayName: "Percent B" },
    { name: IndicatorName.adx, displayName: "ADX" },
    { name: IndicatorName.smaPrice, displayName: "Simple average of price", comparable: true, averageWord: "simple average" },
    { name: IndicatorName.emaPrice, displayName: "Exponential average of price", comparable: true, averageWord: "exponential average" },
]

/** The indicators a rule can be compared with (the server accepts price averages only). */
export const comparableIndicators: IndicatorData[] = indicators.filter((indicator) => indicator.comparable);

export const isComparable = (name: string): boolean => comparableIndicators.some((indicator) => indicator.name === name);

/** A new comparison rule starts as a 20-candle average against a 50-candle one: the classic fast-and-slow pair. */
export const DEFAULT_FAST_WINDOW = 20;
export const DEFAULT_SLOW_WINDOW = 50;


export const defaultParams: Record<string, Record<string, number | null>> = {
    [IndicatorName.rsi]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [IndicatorName.sma]: { 
        [targetValueString]: 1, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [IndicatorName.ema]: { 
        [targetValueString]: 1, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [IndicatorName.macd]: { 
        [targetValueString]: 1, 
        [windowString]: null, 
        [fastWindowString]: 12, 
        [slowWindowString]: 26, 
        [signalWindowString]: 9 
    },
    [IndicatorName.so]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [IndicatorName.bbp]: { 
        [targetValueString]: 0, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [IndicatorName.adx]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    // Price averages have no target number (they are compared with a second average), so it is 0 and never shown.
    [IndicatorName.smaPrice]: {
        [targetValueString]: 0,
        [windowString]: DEFAULT_FAST_WINDOW,
        [fastWindowString]: null,
        [slowWindowString]: null,
        [signalWindowString]: null
    },
    [IndicatorName.emaPrice]: {
        [targetValueString]: 0,
        [windowString]: DEFAULT_FAST_WINDOW,
        [fastWindowString]: null,
        [slowWindowString]: null,
        [signalWindowString]: null
    }
};
