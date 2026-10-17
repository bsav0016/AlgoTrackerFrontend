import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import React, { useState } from "react";
import { Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";

interface HowItWorksDetails {
    title: string;
    description: string;
    link: string;
}

export default function HowItWorksScreen() {
    const [modalDetails, setModalDetails] = useState<HowItWorksDetails | null>(null);
    const theme = useTheme();

    return (
        <CustomHeaderView header="How It Works" displayFunds={false}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
                    <GeneralButton title="Backtest" variant="outline" onPress={() => setModalDetails(backtestDetails)} autoWidth={false} />
                    <GeneralButton title="Strategy Subscription" variant="outline" onPress={() => setModalDetails(strategySubscriptionDetails)} autoWidth={false} />
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Inputs</ThemedText>
                    <ThemedText type="muted" style={styles.sectionHint}>The indicators you build signals from.</ThemedText>
                    <View style={styles.chips}>
                        {inputsDetails.map((inputsDetails, index) => (
                            <GeneralButton key={index} title={inputsDetails.title} variant="secondary" compact fontSize={15} onPress={() => setModalDetails(inputsDetails)} />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Outputs</ThemedText>
                    <ThemedText type="muted" style={styles.sectionHint}>The numbers a backtest reports.</ThemedText>
                    <View style={styles.chips}>
                        {outputsDetails.map((outputsDetails, index) => (
                            <GeneralButton key={index} title={outputsDetails.title} variant="secondary" compact fontSize={15} onPress={() => setModalDetails(outputsDetails)} />
                        ))}
                    </View>
                </View>

                <Modal
                    visible={modalDetails !== null}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalDetails(null)}
                >
                    <TouchableWithoutFeedback onPress={() => setModalDetails(null)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback accessible={false}>
                                <Card style={styles.modalContainer}>
                                    <ThemedText style={styles.modalTitle}>{modalDetails?.title || ""}</ThemedText>
                                    <ScrollView style={styles.modalScroll}>
                                        <ThemedText style={styles.descriptionText}>{modalDetails?.description || ""}</ThemedText>
                                    </ScrollView>
                                    <TouchableOpacity
                                        accessibilityRole="link"
                                        onPress={() => Linking.openURL(modalDetails?.link || "https://www.investopedia.com")}
                                    >
                                        <ThemedText type="muted" style={styles.readMore}>Read more</ThemedText>
                                        <ThemedText style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>
                                            {modalDetails?.link || ""}
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <GeneralButton title="Close" variant="secondary" onPress={() => setModalDetails(null)} autoWidth={false} />
                                </Card>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.xl,
    },

    section: {
        gap: Spacing.sm,
    },

    sectionTitle: {
        ...Type.subtitle,
    },

    sectionHint: {
        fontSize: 14,
    },

    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        padding: Spacing.xl,
    },

    modalContainer: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '80%',
        gap: Spacing.lg,
        borderRadius: Radius.lg,
    },

    modalTitle: {
        ...Type.subtitle,
    },

    modalScroll: {
        flexGrow: 0,
    },

    descriptionText: {
        ...Type.body,
    },

    readMore: {
        ...Type.caption,
        fontWeight: '600',
    },

    linkText: {
        textDecorationLine: 'underline',
        fontSize: 14,
    }
})

const backtestDetails: HowItWorksDetails = {
    title: "Backtest",
    description: "Backtesting takes uses a given strategy to analyzes its performance on historical data."
        + " One of the benefits is that it provides insight as to how effective a strategy MAY be."
        + " Please understand that just because a strategy performs well during backtesting, that DOES NOT guarantee it will perform well in the future."
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
        description: "Bollinger Bands Percent (BBP) is based off of Bollinger Bands, a lagging volatility indicator."
            + " Bollinger Bands represent a certain number of standard deviations from the simple moving average."
            + " Typically, 2 standard deviations are used, and a window size of 20 is used."
            + " The target values used in this application correlate to the number of standard deviations from the mean the close price is."
            + " For example, if your target value is -1.5, you're looking at the close price relative to the lower bollinger band at 1.5 standard deviations.",
        link: "https://www.investopedia.com/terms/b/bollingerbands.asp"
    },

    {
        title: "ADX",
        description: "The average directional index (ADX) is a lagging indicators that provides insight to the strength of a trend."
            + " While ADX measures the strength of a trend, it doesn't provide information on the direction of that trend."
            + " ADX ranges from 0 to 100."
            + " A higher ADX value (typically >25) indicates a strong trend, and can be associated with a buy or sell signal - it typically is paired with other indicators."
            + " Typical window size for ADX is 14.",
        link: "https://www.investopedia.com/articles/trading/07/adx-trading-indicator.asp"
    }
]

const outputsDetails: HowItWorksDetails[] = [
    {
        title: "Percent Return",
        description: "Percent return shows how much value an asset or strategy gains over a period of time."
            + " The values you will see in the backtest results have been annualized."
            + " For example, if the strategy gained 1% over the course of 1 month, then it's annualized to 12% (1% x 12 months = 12%)."
            + " The baseline vs. 0% shows the raw strategy gains."
            + " The baseline vs. asset returns shows the strategy return minus the buy-and-hold return."
            + " If the percent return vs. asset return displays a negative number, this shows the buy-and-hold strategy performed better than your backtested strategy for this period.",
        link: "https://www.investopedia.com/terms/r/returnoninvestment.asp"
    },

    {
        title: "Sharpe Ratio",
        description: "The Sharpe Ratio is used to compare returns to the associated risk."
            + " The numerator is the difference between returns and some baseline returns."
            + " The denominator is the standard deviation of the returns."
            + " An annualized Sharpe ratio above 1 is acceptable, above 2 is very good, and above 3 is outstanding."
            + " The backtest results will display two baselines - 0% returns and the asset returns."
            + " A good Sharpe ratio for the 0% returns indicates your strategy performed well in backtesting as compared to not investing at all."
            + " Meanwhile a good Sharpe ratio against the asset returns indicates your strategy performed well in backtesting as compared to a buy-and-hold strategy.",
        link: "https://www.investopedia.com/terms/s/sharperatio.asp"
    },

    {
        title: "Sortino Ratio",
        description: "The Sortino Ratio is another method to compare returns to associated risk, but only the risk associated with negative returns."
            + " The numerator is the difference between returns and some baseline returns."
            + " The denominator is the standard deviation of the negative returns."
            + " An annualized Sortino ratio above 1 is acceptable, above 2 is very good, and above 3 is outstanding."
            + " The backtest results will display two baselines - 0% returns and the asset returns."
            + " A good Sortino ratio for the 0% returns indicates your strategy performed well in backtesting as compared to not investing at all."
            + " Meanwhile a good Sortino ratio against the asset returns indicates your strategy performed well in backtesting as compared to a buy-and-hold strategy.",
        link: "https://www.investopedia.com/terms/s/sharperatio.asp"
    }
]