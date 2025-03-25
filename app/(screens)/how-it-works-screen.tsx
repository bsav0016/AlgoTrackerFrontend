import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native";

interface HowItWorksDetails {
    title: string;
    description: string;
    link: string;
}

export default function HowItWorksScreen() {
    const [modalDetails, setModalDetails] = useState<HowItWorksDetails | null>(null);

    return (
        <CustomHeaderView header="How It Works" displayFunds={false}>
            <ThemedView style={styles.overviewContainer}>
                <GeneralButton title="Backtest" onPress={() => setModalDetails(backtestDetails)} />
                <GeneralButton title="Strategy Subscription" onPress={() => setModalDetails(strategySubscriptionDetails)} />
            </ThemedView>

            <ThemedView style={styles.inputOutputContainer}>
                <ThemedText>Inputs</ThemedText>
                <ThemedView style={styles.buttonsContainer}>
                    {inputsDetails.map((inputsDetails, index) => (
                        <GeneralButton key={index} title={inputsDetails.title} onPress={() => setModalDetails(inputsDetails)} />
                    ))}
                </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputOutputContainer}>
                <ThemedText>Outputs</ThemedText>
                <ThemedView style={styles.buttonsContainer}>
                    {outputsDetails.map((outputsDetails, index) => (
                        <GeneralButton key={index} title={outputsDetails.title} onPress={() => setModalDetails(outputsDetails)} />
                    ))}
                </ThemedView>
            </ThemedView>

            <Modal
                visible={modalDetails !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalDetails(null)}
            >
                <TouchableWithoutFeedback onPress={() => setModalDetails(null)}>
                    <ThemedView style={styles.modalOverlay}>
                        <ThemedView style={styles.modalContainer}>
                            <ThemedText type="subtitle">{modalDetails?.title || ""}</ThemedText>
                            <ThemedText>{modalDetails?.description || ""}</ThemedText>
                            <ThemedText>Read more:</ThemedText>
                            <TouchableOpacity>
                                <ThemedText style={styles.linkText}>{modalDetails?.link || ""}</ThemedText>
                            </TouchableOpacity>
                            <GeneralButton title="Close" onPress={() => setModalDetails(null)} />
                        </ThemedView>
                    </ThemedView>
                </TouchableWithoutFeedback>
            </Modal>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    overviewContainer: {
        display: 'flex',
        flexDirection: 'row',
        padding: 20
    },

    inputOutputContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },

    buttonsContainer: {
        display: 'flex',
        flexDirection: 'row',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },

    modalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 10,
        width: 250,
    },

    linkText: {
        color: 'blue',
        textDecorationLine: 'underline'
    }
})

const backtestDetails: HowItWorksDetails = {
    title: "Backtest",
    description: "Backtesting takes uses a given strategy to analyzes its performance on historical data"
        + " One of the benefits is that it provides insight as to how effective a strategy MAY be"
        + " Please understand that just because a strategy performs well during backtesting, that DOES NOT guarantee it will perform well in the future"
        + " Market trends change over time and it is important to understand the risks associated with algorithmic trading.",
    link: "https://www.investopedia.com/terms/b/backtesting.asp"
}

const strategySubscriptionDetails: HowItWorksDetails = {
    title: "Strategy Subscription",
    description: "When subscribing to a strategy, you will be provided notifications when the strategy triggers a buy or sell signal."
        + " Data is obtained through a webhook from Twelve Data, analyzed in real time on our servers."
        + " When our servers indicate a buy or sell signal, we will send you a notification and udpate your homepage to reflect the update."
        + " This way, you save time while still reaping the potential benefits of algorithmic trading.",
    link: "https://www.investopedia.com/articles/active-trading/101014/basics-algorithmic-trading-concepts-and-examples.asp"
} 

const inputsDetails: HowItWorksDetails[] = [
    {
        title: "SMA",
        description: "The simple moving average (SMA) is a lagging indicator."
            + " It simply averages the most recent x number of data points."
            + " There is not a pre-determined typical window size for SMA - it varies signficantly based on the user's needs.",
        link: "https://www.investopedia.com/terms/s/sma.asp"
    },

    {
        title: "EMA",
        description: "The exponential moving average (EMA) is a lagging indicator."
            + " It is similar to the SMA by averaging the x most recent data points, but puts heavier weights on the more recent data points."
            + " There is not a pre-determined typical window size for EMA - it varies significantly based on the user's needs.",
        link: "https://www.investopedia.com/terms/e/ema.asp"
    },

    {
        title: "RSI",
        description: "The relative strength index (RSI) is a momentum indicator."
            + " It measures speed and magnitude of recent price changes to find overbought and oversold positions."
            + " RSI can range from 0 to 100."
            + " Higher values (typically >70) indicate an overbought position - when most people would recommend selling."
            + " Meanwhile lower values (typically <30) indicate an oversold position - when most would recommend buying."
            + " RSI is typically viewed over a 14-period window.",
        link: "https://www.investopedia.com/terms/r/rsi.asp"
    },

    {
        title: "MACD",
        description: "The moving average convergence/divergence (MACD) is a trend-following, lagging indicator."
            + " It compares a slow- and fast-exponential moving average (EMA) to provide insights on an assets trends."
            + " MACD ranges from -1.0 and 1.0."
            + " The typical slow EMA, fast EMA, and signal windows are 26, 12, and 9, respectively.",
        link: "https://www.investopedia.com/terms/m/macd.asp"
    },

    {
        title: "SO",
        description: "The stochastic oscillator (only abbreviated to SO in this application for space-saving purposes) is a momentum indicator."
            + " It compares a closing price to the range of prices over a recent time period."
            + " The stochastic oscillator can range from 0 to 100."
            + " Higher values (typically >80) indicate an overbought position - when most people would recommend selling."
            + " Meanwhile lower values (typically <20) indicate an oversold position - when most would recommend buying."
            + " The stochastic oscillator is typically viewed of a 14-period window.",
        link: "https://www.investopedia.com/terms/s/stochasticoscillator.asp"
    },

    {
        title: "BBP",
        description: "",
        link: "https://www.investopedia.com/terms/b/bollingerbands.asp"
    },

    {
        title: "ADX",
        description: "",
        link: ""
    }
]

const outputsDetails: HowItWorksDetails[] = [
    {
        title: "Percent Return",
        description: "Percent return tells us how much the strategy returned and it is normalized to annual returns",
        link: "www.google.com"
    }
]