import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import React from "react";
import { ThemedView } from "@/components/ThemedView";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GeneralButton } from "@/components/GeneralButton";
import { StrategyService } from "@/features/strategy/StrategyService";
import { useAuth } from "@/contexts/AuthContext";


export default function ViewStrategy() {
    const { strategy, setStrategy } = useStrategy();
    const { accessToken } = useAuth()
    const { routeBack } = useRouteTo();
    const { addToast } = useToast();

    if (!strategy) {
        addToast("Could not load strategy. Returning home...");
        routeBack();
        return;
    }

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

    const confirmStopStrategy = () => {
        addToast("This will stop your strategy and remove it altogether. Would you like to proceed?", [{
            label: 'Yes',
            callback: () => stopStrategy()
        }])
    }

    const stopStrategy = async () => {
        if (!accessToken) {
            addToast("Error stopping strategy. Please contact the support team");
            return;
        }
        await StrategyService.unsubscribeStrategy(strategy, accessToken);
        setStrategy(null);
        routeBack();
    }


    return (
        <CustomHeaderView header={strategy.title}>
            <ThemedView>
                <ThemedText style={styles.returnText}>Strategy Return: {calculatePercentage(strategy.strategyReturn)}%</ThemedText>
                <ThemedText style={styles.returnText}>Asset Return: {calculatePercentage(strategy.assetReturn)}%</ThemedText>

                <ThemedView style={styles.rechargeContainer}>
                    <ThemedText>Strategy subscription charged again in:</ThemedText>
                    <CountdownTimer timeRemaining={(strategy.chargeUserDate.getTime() - Date.now()) / 1000}/>
                </ThemedView>
                

                <GeneralButton title="Stop Strategy" onPress={confirmStopStrategy} />

                <ThemedView style={styles.tradeHeaderContainer}>
                    <ThemedText style={styles.tradeHeaderText}>Trade Data:</ThemedText>
                </ThemedView>
                
                <ThemedView style={[styles.tradeContainer, { marginTop: 10 }]}>
                    <ThemedText style={[styles.dateText, styles.headerText]}>Date</ThemedText>
                    <ThemedText style={[styles.priceText, styles.headerText]}>Price</ThemedText>
                    <ThemedText style={[styles.actionText, styles.headerText]}>Action</ThemedText>
                </ThemedView>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    {strategy.trades.length > 0 ?
                        <>
                            {strategy.trades.map((trade, index) => (
                                <React.Fragment key={index}>
                                    <ThemedView style={styles.tradeContainer}>
                                        <ThemedText style={styles.dateText}>{formattedDate(trade.date)}</ThemedText>
                                        <ThemedText style={styles.priceText}>{trade.price}</ThemedText>
                                        <ThemedText style={styles.actionText}>{trade.isBuy ? "Buy" : "Sell"}</ThemedText>
                                    </ThemedView>

                                    {index < strategy.trades.length - 1 && 
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

    rechargeContainer: {
        marginVertical: 15,
        alignItems: 'center'
    },

    tradeHeaderContainer: {
        marginTop: 30
    },

    tradeHeaderText: {
        fontWeight: 600,
        fontSize: 24,
        textAlign: 'center',
        textDecorationLine: 'underline'
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

    headerText: {
        fontWeight: 600,
        fontSize: 22,
        textDecorationLine: 'underline'
    },

    noTradesText: {
        textAlign: 'center'
    },
    
    divider: {
        height: 1,
        marginVertical: 8
    },
})