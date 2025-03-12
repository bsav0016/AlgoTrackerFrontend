import { Strategy } from "@/features/strategy/classes/Strategy";
import React, { createContext, ReactNode, useState } from "react";

interface StrategyContextType {
    strategy: Strategy | null;
    setStrategy: (newStrategy: Strategy | null) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export const StrategyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    return (
        <StrategyContext.Provider value={{ strategy, setStrategy }}>
            {children}
        </StrategyContext.Provider>
    );
};

export const useStrategy = (): StrategyContextType => {
    const context = React.useContext(StrategyContext);
    if (!context) {
        throw new Error('useStrategy must be used within a StrategyProvider');
    }
    return context;
};
