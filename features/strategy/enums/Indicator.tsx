export interface IndicatorData {
    name: IndicatorName;
    displayName: string;
}

export enum IndicatorName {
    rsi = "RSI",
    sma = "SMA",
    ema = "EMA",
    macd = "MACD",
    so = "SO",
    bbp = "BBP",
    adx = "ADX"
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
]


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
    }
};
