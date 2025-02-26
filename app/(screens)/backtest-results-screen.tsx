import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Backtest } from "@/features/strategy/classes/Backtest";
import { useLocalSearchParams } from "expo-router";


export default function BacktestResults() {
    const { backtest } = useLocalSearchParams(); 
    
    const backtestResults = backtest 
        ? Backtest.fromNavigationJSON(decodeURIComponent(backtest as string)) 
        : null;

    return (
        <CustomHeaderView header="Backtest Results">
            <ThemedView>
                <ThemedText>Results go here</ThemedText>
            </ThemedView>
        </CustomHeaderView>
    )
}