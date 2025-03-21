import React, { useEffect, useState } from "react";
import { Image, Dimensions, Switch, StyleSheet } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Routes } from "@/app/Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import ReactNativeZoomableView from '@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView';
import BacktestResultsTable from "@/features/strategy/components/backtestResultsTable";


const processImageString = (imageString: string) => {
    try {
        return `data:image/png;base64,${imageString}`;
    } catch (error) {
        throw error;
    }
};

export default function BacktestResults() {
    const { backtestData } = useBacktest(); 
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();
    const [displaySignals, setDisplaySignals] = useState(true);

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageUriNoSignals, setImageUriNoSignals] = useState<string | null>(null);

    useEffect(() => {
        if (!backtestData) {
            addToast("Could not properly retrieve backtest data");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }

        if (!backtestData.resultImage || !backtestData.resultImageNoSignals) {
            addToast("Could not properly load backtest result");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }

        const processedImageUri = processImageString(backtestData.resultImage);
        setImageUri(processedImageUri);      

        const processedImageUriNoSignals = processImageString(backtestData.resultImageNoSignals);
        setImageUriNoSignals(processedImageUriNoSignals)
    }, [backtestData]);

    return (
        <CustomHeaderView header="Backtest Results">
            <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ThemedView style={styles.chartContainer}>
                    <ThemedView style={styles.displaySignalsContainer}>
                        <ThemedText>Display Chart Signals</ThemedText>
                        <Switch value={displaySignals} onValueChange={(value) => setDisplaySignals(value)} />
                    </ThemedView>

                    <ThemedView>
                        {(imageUri && imageUriNoSignals) ? (
                            <ReactNativeZoomableView bindToBorders={true} maxZoom={3} minZoom={1}>
                                <Image
                                    source={{ uri: displaySignals ? imageUri : imageUriNoSignals }}
                                    style={{ width: Dimensions.get("window").width - 40, height: 300, resizeMode: "contain" }}
                                />
                            </ReactNativeZoomableView>
                        ) : (
                            <ThemedText>No image available</ThemedText>
                        )}
                    </ThemedView>
                </ThemedView>

                <ThemedView style={styles.tableContainer}>
                    <BacktestResultsTable
                        percentReturn={backtestData?.percentReturn || null}
                        percentReturnAdj={backtestData?.percentReturnAdj || null}
                        sharpeRatio={backtestData?.sharpeRatio || null}
                        sharpeRatioAdj={backtestData?.sharpeRatioAdj || null}
                        sortinoRatio={backtestData?.sortinoRatio || null}
                        sortinoRatioAdj={backtestData?.sortinoRatioAdj || null}
                    />
                </ThemedView>
            </ThemedView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    chartContainer: {
        flex: 2,
        marginTop: 15
    }, 

    displaySignalsContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },

    tableContainer: {
        flex: 3,
        width: '80%',
        justifyContent: 'center'
    }
})