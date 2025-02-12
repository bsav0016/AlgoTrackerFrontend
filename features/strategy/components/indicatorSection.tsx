import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Indicator } from "../enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SignalSectionProps {
    sectionTitle: string;
    signals: Signal[];
    setSignals: (signals: Signal[]) => void;
    buttonText: string;
    buttonAction: () => void;
}

export function IndicatorSection({
    sectionTitle,
    signals,
    setSignals,
    buttonText,
    buttonAction
}: SignalSectionProps) {  
    const textInputColor = useThemeColor({}, 'text');
    const [activeModal, setActiveModal] = useState<number | null>(null);

    const openModal = (index: number) => setActiveModal(index);
    const closeModal = () => setActiveModal(null);
    
    return (
        <>
        <ThemedText style={styles.signalSectionHeader}>{sectionTitle}</ThemedText>
        {signals.map((signal, index) => (
            <ThemedView key={index} style={[styles.strategyView, { marginBottom: 20 }]}>
                <ThemedView style={styles.symbolContainer}>
                    <ThemedText style={{ fontWeight: 700 }}>{`Indicator ${index + 1}`}:</ThemedText>
                    <TouchableOpacity 
                        style={[styles.dropdown, {flexDirection: 'row'}]} 
                        onPress={() => openModal(index)}
                    >
                        <ThemedText>{signal.indicator}</ThemedText>
                        <ThemedText>▼</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                <Modal
                    visible={activeModal === (index)}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={closeModal}
                >
                    <TouchableWithoutFeedback onPress={closeModal}>
                        <ThemedView style={styles.modalOverlay}>
                            <ThemedView style={styles.modalContainer}>
                                {Object.entries(Indicator).map(([key, value]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            const newSignal = new Signal(value as Indicator, signal.targetValue, signal.aboveTarget);
                                            const newSignals = [...signals]
                                            newSignals[index] = newSignal;
                                            setSignals(newSignals);
                                            closeModal();
                                        }}
                                    >
                                        <Text>{value}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ThemedView>
                        </ThemedView>
                    </TouchableWithoutFeedback>
                </Modal>

                <ThemedView style={styles.symbolContainer}>
                    <ThemedText>Target Value:</ThemedText>
                    <TextInput
                        style={[styles.input, { color: textInputColor }]}
                        keyboardType="numeric"
                        returnKeyType="done"
                        value={signal.targetValue.toString()}
                        onChangeText={(text) => {
                            const newNumber = text === "" ? 0 : parseFloat(text);
                            const newSignal = new Signal(signal.indicator, newNumber, signal.aboveTarget);
                            const newSignals = [...signals];
                            newSignals[index] = newSignal;
                            setSignals(newSignals);
                        }}
                    />
                </ThemedView>

                <ThemedView style={{maxWidth: '80%', alignSelf: 'center'}}>
                    <ThemedText>Trigger when signal greater than or less than target?</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.firstContainer}>
                    <ThemedView style={styles.symbolContainer}>
                        <ThemedText>Greater</ThemedText>
                        <Switch value={signal.aboveTarget} onValueChange={(value) => {
                            const newSignal = new Signal(signal.indicator, signal.targetValue, value);
                            const newSignals = [...signals];
                            newSignals[index] = newSignal;
                            setSignals(newSignals);
                        }}/>
                    </ThemedView>

                    <ThemedView style={styles.symbolContainer}>
                        <ThemedText>Less</ThemedText>
                        <Switch value={!signal.aboveTarget} onValueChange={(value) => {
                            const newSignal = new Signal(signal.indicator, signal.targetValue, !value);
                            const newSignals = [...signals];
                            newSignals[index] = newSignal;
                            setSignals(newSignals);
                        }}/>
                    </ThemedView>
                </ThemedView>
                
            </ThemedView>
        ))}
        
        {signals.length < 3 &&
            <ThemedView style={{ alignItems: 'center' }}><GeneralButton title={buttonText} onPress={buttonAction}/></ThemedView>
        }
        </>
    )
}

const styles = StyleSheet.create({
    strategyView: {
        flex: 1,
        flexDirection: 'column',
        gap: 15
    },

    firstContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    },

    symbolContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        fontSize: 18,
        width: 100,
        textAlign: "center",
    },

    dropdown: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: 100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    signalSectionHeader: {
        textAlign: 'center', 
        fontWeight: 700, 
        marginTop: 30, 
        fontSize: 24 
    },

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