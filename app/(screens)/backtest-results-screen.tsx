import React, { useEffect, useState } from "react";
import { Image, Dimensions } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Routes } from "./Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import ReactNativeZoomableView from '@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView';


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

    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        if (!backtestData) {
            addToast("Could not properly retrieve backtest data");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }

        if (!backtestData.resultImage) {
            addToast("Could not properly load backtest result");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }

        const processedImageUri = processImageString(backtestData.resultImage);
        setImageUri(processedImageUri);      
    }, [backtestData]);

    return (
        <CustomHeaderView header="Backtest Results">
            <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                {imageUri ? (
                    <ReactNativeZoomableView bindToBorders={true} maxZoom={3} minZoom={1}>
                        <Image
                            source={{ uri: imageUri }}
                            style={{ width: Dimensions.get("window").width - 40, height: 300, resizeMode: "contain" }}
                        />
                    </ReactNativeZoomableView>
                ) : (
                    <ThemedText>No image available</ThemedText>
                )}
            </ThemedView>
        </CustomHeaderView>
    );
}
