import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Interval } from "../enums/Interval";


interface IntervalModalProps {
    setIntervalLength: (interval: Interval) => void;
    intervalModal: boolean;
    setIntervalModal: (value: boolean) => void;
}

export function IntervalModal({ setIntervalLength, intervalModal, setIntervalModal }: IntervalModalProps) {
    return (
        <Modal
            visible={intervalModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIntervalModal(false)}
        >
            <TouchableWithoutFeedback onPress={() => setIntervalModal(false)}>
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={styles.modalContainer}>
                        {Object.entries(Interval).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.modalOption}
                                onPress={() => {
                                    setIntervalLength(value as Interval);
                                    setIntervalModal(false);
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