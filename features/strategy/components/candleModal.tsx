import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { CandleLength } from "../enums/CandleLength";


interface CandleModalProps {
    setCandleLength: (candle: CandleLength) => void;
    candleModal: boolean;
    setCandleModal: (value: boolean) => void;
}

export function CandleModal({ setCandleLength, candleModal, setCandleModal }: CandleModalProps) {
    return (
        <Modal
            visible={candleModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setCandleModal(false)}
        >
            <TouchableWithoutFeedback onPress={() => setCandleModal(false)}>
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={styles.modalContainer}>
                        {Object.entries(CandleLength).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.modalOption}
                                onPress={() => {
                                    setCandleLength(value as CandleLength);
                                    setCandleModal(false);
                                }}
                            >
                                <Text>{value}</Text>
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                </ThemedView>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },

    modalContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: 250,
    },

    modalOption: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#ccc",
    },
})