import { Backtest } from "@/features/strategy/classes/Backtest";
import React, { createContext, ReactNode, useState } from "react";

interface BacktestContextType {
    backtestData: Backtest | null;
    setBacktestData: (newBacktest: Backtest | null) => void;
}

const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

export const BacktestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [backtestData, setBacktestData] = useState<Backtest | null>(null);
    return (
        <BacktestContext.Provider value={{ backtestData, setBacktestData }}>
            {children}
        </BacktestContext.Provider>
    );
};

export const useBacktest = (): BacktestContextType => {
    const context = React.useContext(BacktestContext);
    if (!context) {
        throw new Error('useBacktest must be used within a BacktestProvider');
    }
    return context;
};
