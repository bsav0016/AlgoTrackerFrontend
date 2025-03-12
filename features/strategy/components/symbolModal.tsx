import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";


interface SymbolModalProps {
    availableSymbols: string[];
    setSymbol: (symbol: string) => void;
    symbolModal: boolean;
    setSymbolModal: (value: boolean) => void;
}

export function SymbolModal({ availableSymbols, setSymbol, symbolModal, setSymbolModal }: SymbolModalProps) {
    return (
        <Modal
            visible={symbolModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setSymbolModal(false)}
        >
            <TouchableWithoutFeedback onPress={() => setSymbolModal(false)}>
                <ThemedView style={styles.modalOverlay}>
                    <ThemedView style={styles.modalContainer}>
                        {availableSymbols.map((symbol) => (
                            <TouchableOpacity
                                key={symbol}
                                style={styles.modalOption}
                                onPress={() => {
                                    setSymbol(symbol);
                                    setSymbolModal(false);
                                }}
                            >
                                <Text>{symbol}</Text>
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