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
    [Indicator.MACD]: { "Short Window": number; "Long Window": number };
};


export const defaultParams: Record<Indicator, Record<string, number>> = {
    [Indicator.RSI]: { "Window": 14 },
    [Indicator.SMA]: { "Window": 20 },
    [Indicator.EMA]: { "Window": 20 },
    [Indicator.MACD]: { "Short Window": 12, "Long Window": 26 },
};

export type SignalParameters = IndicatorParameters[Indicator];
