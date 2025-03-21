export interface IndicatorData {
    name: string;
    displayName: string;
}

const rsiString = "RSI";
const smaString = "SMA";
const emaString = "EMA";
const macdString = "MACD";
const soString = "SO";
const bbpString = "BBP";
const adxString = "ADX";

export const targetValueString = "targetValue"
export const windowString = "Window";
export const fastWindowString = "Fast Window";
export const slowWindowString = "Slow Window";
export const signalWindowString = "Signal Window";

export const indicators: IndicatorData[] = [
    { name: rsiString, displayName: "RSI" },
    { name: smaString, displayName: "SMA/Current Price" },
    { name: emaString, displayName: "EMA/Current Price" },
    { name: macdString, displayName: "MACD/Current Price" },
    { name: soString, displayName: "Stochastic Oscillator"},
    { name: bbpString, displayName: "Percent B" },
    { name: adxString, displayName: "ADX" },
]


export const defaultParams: Record<string, Record<string, number | null>> = {
    [rsiString]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [smaString]: { 
        [targetValueString]: 1, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [emaString]: { 
        [targetValueString]: 1, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [macdString]: { 
        [targetValueString]: 1, 
        [windowString]: null, 
        [fastWindowString]: 12, 
        [slowWindowString]: 26, 
        [signalWindowString]: 9 
    },
    [soString]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [bbpString]: { 
        [targetValueString]: 0, 
        [windowString]: 20, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    },
    [adxString]: { 
        [targetValueString]: 50, 
        [windowString]: 14, 
        [fastWindowString]: null, 
        [slowWindowString]: null, 
        [signalWindowString]: null 
    }
};
