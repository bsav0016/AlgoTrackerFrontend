import React, { useEffect, useState } from "react";
import { Image, Dimensions, Switch, StyleSheet, ScrollView, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, useTheme } from "@/constants/Theme";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Routes } from "@/app/Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import BacktestResultsTable from "@/features/strategy/components/backtestResultsTable";


// Card padding (Spacing.lg + Spacing.md on each side) plus the card border; the chart images are about 2:1.
const CHART_WIDTH = Dimensions.get("window").width - 2 * (Spacing.lg + Spacing.md) - 2;
const CHART_HEIGHT = Math.round(CHART_WIDTH / 2);

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
    const theme = useTheme();
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
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <ThemedText type="defaultSemiBold">Strategy vs. asset</ThemedText>
                        <View style={styles.toggle}>
                            <ThemedText type="muted" style={styles.toggleLabel}>Signals</ThemedText>
                            <Switch
                                value={displaySignals}
                                onValueChange={(value) => setDisplaySignals(value)}
                                trackColor={{ true: theme.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>

                    {(imageUri && imageUriNoSignals) ? (
                        <ReactNativeZoomableView bindToBorders={true} maxZoom={3} minZoom={1} style={styles.chartZoom}>
                            <Image
                                source={{ uri: displaySignals ? imageUri : imageUriNoSignals }}
                                style={styles.chartImage}
                            />
                        </ReactNativeZoomableView>
                    ) : (
                        <ThemedText type="muted">No image available</ThemedText>
                    )}
                </Card>

                <BacktestResultsTable
                    percentReturn={backtestData?.percentReturn ?? null}
                    percentReturnAdj={backtestData?.percentReturnAdj ?? null}
                    sharpeRatio={backtestData?.sharpeRatio ?? null}
                    sharpeRatioAdj={backtestData?.sharpeRatioAdj ?? null}
                    sortinoRatio={backtestData?.sortinoRatio ?? null}
                    sortinoRatioAdj={backtestData?.sortinoRatioAdj ?? null}
                />
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    chartCard: {
        gap: Spacing.sm,
        padding: Spacing.md,
    },

    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    toggleLabel: {
        fontSize: 14,
    },

    chartZoom: {
        height: CHART_HEIGHT,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
    },

    chartImage: {
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        resizeMode: "contain",
    },
})
