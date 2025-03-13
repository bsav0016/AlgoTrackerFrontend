import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { Indicators, defaultParams, fastWindowString, signalWindowString, slowWindowString, targetValueString, windowString } from "../enums/Indicator";
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

    const deleteIndicator = (index: number) => {
        const newSignals: Signal[] = signals.filter((_, i) => i !== index);
        setSignals(newSignals);
    }
    
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
                                {Indicators.map((indicator) => (
                                    <TouchableOpacity
                                        key={indicator.name}
                                        style={styles.modalOption}
                                        onPress={() => {
                                            const newSignal = new Signal(
                                                indicator.name, 
                                                defaultParams[indicator.name][targetValueString] ?? 0, 
                                                true, 
                                                defaultParams[indicator.name][windowString],
                                                defaultParams[indicator.name][fastWindowString],
                                                defaultParams[indicator.name][slowWindowString],
                                                defaultParams[indicator.name][signalWindowString]
                                            );
                                            const newSignals = [...signals];
                                            newSignals[index] = newSignal;
                                            setSignals(newSignals);
                                            closeModal();
                                        }}
                                    >
                                        <Text>{indicator.displayName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ThemedView>
                        </ThemedView>
                    </TouchableWithoutFeedback>
                </Modal>

                {[
                    { label: windowString, value: signal.window },
                    { label: fastWindowString, value: signal.fastWindow },
                    { label: slowWindowString, value: signal.slowWindow },
                    { label: signalWindowString, value: signal.signalWindow }
                ].map(({ label, value }) => (
                    value !== null && (
                        <ThemedView key={label} style={styles.symbolContainer}>
                            <ThemedText>{label}:</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textInputColor }]}
                                keyboardType="numeric"
                                returnKeyType="done"
                                value={value.toString()}
                                onChangeText={(text) => {
                                    const cleanedText = text.replace(/[^-.\d]/g, '');
                                    const validText = cleanedText
                                        .replace(/^(-?)(.*)-/g, '$1$2')
                                        .replace(/(\..*)\./g, '$1');

                                    const newNumber = validText === '' || validText === '-' || validText === '.' ? 0 : parseFloat(validText);

                                    const newSignal = new Signal(
                                        signal.indicator, 
                                        signal.targetValue, 
                                        signal.aboveTarget, 
                                        label === windowString ? newNumber : signal.window,
                                        label === fastWindowString ? newNumber : signal.fastWindow,
                                        label === slowWindowString ? newNumber : signal.slowWindow,
                                        label === signalWindowString ? newNumber : signal.signalWindow
                                    );

                                    const newSignals = [...signals];
                                    newSignals[index] = newSignal;
                                    setSignals(newSignals);
                                }}
                            />
                        </ThemedView>
                    )
                ))}

                <ThemedView style={styles.symbolContainer}>
                    <ThemedText>Target Value:</ThemedText>
                    <TextInput
                        style={[styles.input, { color: textInputColor }]}
                        keyboardType="numeric"
                        returnKeyType="done"
                        value={signal.targetValue.toString()}
                        onChangeText={(text) => {
                            const newNumber = text === "" ? 0 : parseFloat(text);
                            const newSignal = new Signal(
                                signal.indicator, 
                                newNumber, 
                                signal.aboveTarget, 
                                signal.window,
                                signal.fastWindow,
                                signal.slowWindow,
                                signal.signalWindow
                            );
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
                            const newSignal = new Signal(
                                signal.indicator, 
                                signal.targetValue, 
                                value,
                                signal.window,
                                signal.fastWindow,
                                signal.slowWindow,
                                signal.signalWindow
                            );
                            const newSignals = [...signals];
                            newSignals[index] = newSignal;
                            setSignals(newSignals);
                        }}/>
                    </ThemedView>

                    <ThemedView style={styles.symbolContainer}>
                        <ThemedText>Less</ThemedText>
                        <Switch value={!signal.aboveTarget} onValueChange={(value) => {
                            const newSignal = new Signal(
                                signal.indicator, 
                                signal.targetValue, 
                                !value, 
                                signal.window,
                                signal.fastWindow,
                                signal.slowWindow,
                                signal.signalWindow
                            );
                            const newSignals = [...signals];
                            newSignals[index] = newSignal;
                            setSignals(newSignals);
                        }}/>
                    </ThemedView>
                </ThemedView>

                <TouchableOpacity 
                    onPress={() => deleteIndicator(index)} 
                    style={styles.deleteButton}
                >
                    <ThemedText>Delete</ThemedText>
                </TouchableOpacity>
                
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
        gap: 15,
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 5,
        margin: 10,
        padding: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 5
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

    deleteButton: {
        borderWidth: 1,
        borderRadius: 5,
        width: 'auto',
        alignSelf: 'center',
        padding: 5,
        backgroundColor: 'red'
    },
})