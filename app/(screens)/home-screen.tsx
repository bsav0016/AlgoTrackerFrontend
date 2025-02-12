import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Routes } from "./Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { ThemedView } from "@/components/ThemedView";


export default function Home() {
    const { userRef } = useUser();
    const { routeTo } = useRouteTo();

    const goToStrategy = (strategyType: StrategyType) => {
        routeTo(Routes.StrategySelection, { strategyType });
    }

    const goToDeposit = () => {
        routeTo(Routes.DepositFunds);
    }

    const goToHowItWorks = () => {
        routeTo(Routes.HowItWorks);
    }

    return (
        <CustomHeaderView header={`Welcome back, ${userRef.current?.firstName}!`} canGoBack={false}>
            <ThemedView style={styles.buttonContainer}>
                <GeneralButton title="How it Works" onPress={goToHowItWorks} />
                <GeneralButton title="Run a Backtest" onPress={() => goToStrategy(StrategyType.Backtest)} />
                <GeneralButton title="Subscribe to a Strategy" onPress={() => goToStrategy(StrategyType.Subscription)} />
                <GeneralButton title="Deposit Funds" onPress={goToDeposit} />
            </ThemedView>
            
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <ThemedView style={styles.strategiesContainer}>
                    <ThemedText style={styles.strategiesHeader}>Strategy Subscriptions:</ThemedText>
                    {userRef.current?.strategies.map((strategy) => (
                        <ThemedText>Place strategy here!</ThemedText> //TODO: Complete what this will look like
                    ))
                    }
                </ThemedView>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 30,
        gap: 5,
        width: '75%',
        alignSelf: 'center'
    },

    strategiesContainer: {
        marginTop: 30,
        alignSelf: 'center'
    },

    strategiesHeader: {
        fontWeight: 600
    },
})