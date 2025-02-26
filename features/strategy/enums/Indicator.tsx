export enum Indicator {
    RSI = "RSI",
    SMA = "SMA",
    EMA = "EMA",
    MACD = "MACD"
}

export type IndicatorParameters = {
    [Indicator.RSI]: { "Window": number };
    [Indicator.SMA]: { "Window": number };
    [Indicator.EMA]: { "Window": number };
    [Indicator.MACD]: { "Fast Window": number; "Slow Window": number, "Signal Window": number };
};


export const defaultParams: Record<Indicator, Record<string, number>> = {
    [Indicator.RSI]: { "Window": 14 },
    [Indicator.SMA]: { "Window": 20 },
    [Indicator.EMA]: { "Window": 20 },
    [Indicator.MACD]: { "Fast Window": 12, "Slow Window": 26, "Signal Window": 9 },
};

export type SignalParameters = IndicatorParameters[Indicator];
