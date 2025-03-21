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
    description: "Backtesting is important",
    link: "www.google.com"
}

const strategySubscriptionDetails: HowItWorksDetails = {
    title: "Strategy Subscription",
    description: "Strategy subscription is important",
    link: "www.google.com"
} 

const inputsDetails: HowItWorksDetails[] = [
    {
        title: "RSI",
        description: "RSI is a measure of whether a strategy is overbought or underbought",
        link: "www.google.com"
    }
]

const outputsDetails: HowItWorksDetails[] = [
    {
        title: "Percent Return",
        description: "Percent return tells us how much the strategy returned and it is normalized to annual returns",
        link: "www.google.com"
    }
]