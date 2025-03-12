import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { Trade } from "@/features/strategy/classes/Trade";
import React, { useEffect, useState } from "react";
import { Routes } from "./Routes";
import { ThemedView } from "@/components/ThemedView";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";

export default function ViewStrategy() {
    const { strategy } = useStrategy();
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();

    const [title, setTitle] = useState<string>('');
    const [strategyReturn, setStrategyReturn] = useState<number>(1)
    const [assetReturn, setAssetReturn] = useState<number>(1);
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        if (!strategy) {
            addToast("Could not load strategy. Returning home...");
            routeTo(Routes.Home);
            return;
        }
        
        setTitle(strategy.title);
        setStrategyReturn(strategy.strategyReturn);
        setAssetReturn(strategy.assetReturn);
        setTrades(strategy.trades);
    }, []);

    const calculatePercentage = (value: number): string => {
        return ((value - 1) * 100).toFixed(2);
    }

    const formattedDate = (date: Date): string => {
        return date.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    }

    return (
        <CustomHeaderView header={title}>
            <ThemedView>
                <ThemedText style={styles.returnText}>Strategy Return: {calculatePercentage(strategyReturn)}%</ThemedText>
                <ThemedText style={styles.returnText}>Asset Return: {calculatePercentage(assetReturn)}%</ThemedText>

                <ThemedView style={styles.tradeHeaderContainer}>
                    <ThemedText style={styles.tradeHeaderText}>Trade Data:</ThemedText>
                </ThemedView>
                
                <ThemedView style={[styles.tradeContainer, { marginTop: 10 }]}>
                    <ThemedText style={[styles.dateText, styles.boldText]}>Date</ThemedText>
                    <ThemedText style={[styles.priceText, styles.boldText]}>Price</ThemedText>
                    <ThemedText style={[styles.actionText, styles.boldText]}>Action</ThemedText>
                </ThemedView>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    {trades.length > 0 ?
                        <>
                            {trades.map((trade, index) => (
                                <React.Fragment key={index}>
                                    <ThemedView style={styles.tradeContainer}>
                                        <ThemedText style={styles.dateText}>{formattedDate(trade.date)}</ThemedText>
                                        <ThemedText style={styles.priceText}>{trade.price}</ThemedText>
                                        <ThemedText style={styles.actionText}>{trade.isBuy ? "Buy" : "Sell"}</ThemedText>
                                    </ThemedView>

                                    {/* Add divider except after the last item */}
                                    {index < trades.length - 1 && 
                                        <ThemedView style={[
                                            styles.divider,
                                            { backgroundColor: '#ccc' }
                                        ]}/>
                                    }
                                </React.Fragment>
                            ))}
                        </>
                        
                        :

                        <ThemedText style={styles.noTradesText}>No trades have been triggered</ThemedText>
                    }
                </ScrollView>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    returnText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 700
    },

    tradeHeaderContainer: {
        marginTop: 30
    },

    tradeHeaderText: {
        fontWeight: 600,
        fontSize: 24,
        textAlign: 'center'
    },

    tradesHeader: {
        textAlign: 'center',
        fontWeight: 600,
    },

    tradeContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignItems: 'center'
    },

    dateText: {
        flex: 1,
        textAlign: 'center'
    },

    priceText: {
        flex: 1,
        textAlign: 'center'
    },

    actionText: {
        flex: 1,
        textAlign: 'center'
    },

    boldText: {
        fontWeight: 600,
        fontSize: 22
    },

    noTradesText: {
        textAlign: 'center'
    },
    
    divider: {
        height: 1,
        marginVertical: 8
    },
})