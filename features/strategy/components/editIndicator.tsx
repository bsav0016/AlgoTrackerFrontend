import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { Modal, StyleSheet, Switch, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { indicators, defaultParams, fastWindowString, signalWindowString, slowWindowString, targetValueString, windowString, IndicatorName } from "../enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useToast } from "@/contexts/ToastContext";

interface EditIndicatorProps {
    signals: Signal[];
    setSignals: (signals: Signal[]) => void;
    indicatorIndex: number;
    setIndicatorIndex: (index: number | null) => void;
}

export function EditIndicator({
    signals,
    setSignals,
    indicatorIndex,
    setIndicatorIndex
}: EditIndicatorProps) {  
    const textInputColor = useThemeColor({}, 'text');
    const { addToast } = useToast();
    const [modal, setModal] = useState<boolean>(false);
    const signal = signals[indicatorIndex];
    const [formInput, setFormInput] = useState<string>('');

    const maxWindow = 200;
    const validateInput = () => {
        if (signal.window !== null && (signal.window < 1 || signal.window > maxWindow)) {
            addToast(`Window size must be between 1 and ${maxWindow}`);
            return;
        }

        if (
            [IndicatorName.rsi, IndicatorName.so, IndicatorName.adx].includes(signal.indicator.name)
        ) {
            if (signal.targetValue <= 0 || signal.targetValue >= 100) {
                addToast("Target value must be between 0 and 100, non-inclusive");
                return;
            }
        }

        if ([IndicatorName.sma, IndicatorName.ema].includes(signal.indicator.name)) {
            if (signal.targetValue <= 0) {
                addToast("Target value must be greater than 0");
                return;
            } else if (signal.targetValue <= 0.5 || signal.targetValue >= 1.5) {
                addToast("Warning: Your target value is acceptable, but extreme. 1.0 is the default");
            }
        }

        if (signal.indicator.name === IndicatorName.bbp) {
            if (signal.targetValue < -3.0 || signal.targetValue > 3.0) {
                addToast("Warning: Your target value is acceptable, but extreme. -2.0 or 2.0 is default, and anything outside of 3.0 standard deviations will rarely trigger a signal")
            }
        }

        if (signal.indicator.name === IndicatorName.macd) {
            const fastWindow = signal.fastWindow || 0;
            const slowWindow = signal.slowWindow || 0;
            const signalWindow = signal.signalWindow || 0;
            if (fastWindow < 1 || fastWindow > maxWindow || slowWindow < 1 || slowWindow > maxWindow || signalWindow < 1 || signalWindow > maxWindow) {
                addToast(`All windows must be between 1 and ${maxWindow}`);
                return;
            }
            if (fastWindow === slowWindow) {
                addToast("Fast window and slow window cannot be the same");
                return;
            }
            if (fastWindow > slowWindow) {
                addToast("Warning: fast window is typically less than slow window");
            }
        }

        setIndicatorIndex(null);
    }
    
    return (
        <ThemedView style={styles.signalContainer}>
            <ThemedView style={styles.parameterContainer}>
                <TouchableOpacity 
                    style={[styles.dropdown, {flexDirection: 'row'}]} 
                    onPress={() => setModal(true)}
                >
                    <ThemedText>{signal.indicator.displayName}</ThemedText>
                    <ThemedText>▼</ThemedText>
                </TouchableOpacity>
            </ThemedView>

            <Modal
                visible={modal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModal(false)}>
                    <ThemedView style={styles.modalOverlay}>
                        <ThemedView style={styles.modalContainer}>
                            {indicators.map((indicator) => (
                                <TouchableOpacity
                                    key={indicator.name}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        const newSignal = new Signal(
                                            indicator, 
                                            defaultParams[indicator.name][targetValueString] ?? 0, 
                                            true, 
                                            defaultParams[indicator.name][windowString],
                                            defaultParams[indicator.name][fastWindowString],
                                            defaultParams[indicator.name][slowWindowString],
                                            defaultParams[indicator.name][signalWindowString]
                                        );
                                        const newSignals = [...signals];
                                        newSignals[indicatorIndex] = newSignal;
                                        setSignals(newSignals);
                                        setModal(false);
                                    }}
                                >
                                    <ThemedText>{indicator.displayName}</ThemedText>
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
                    <ThemedView key={label} style={styles.parameterContainer}>
                        <ThemedText>{label}:</ThemedText>
                        <TextInput
                            style={[styles.input, { color: textInputColor }]}
                            keyboardType="numeric"
                            returnKeyType="done"
                            value={value.toString()}
                            onChangeText={(text) => {
                                const cleanedText = text.replace(/\D/g, '').slice(0, 3);                            
                                const newNumber = cleanedText === '' ? 0 : parseInt(cleanedText, 10);
                            
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
                                newSignals[indicatorIndex] = newSignal;
                                setSignals(newSignals);
                            }}
                        />
                    </ThemedView>
                )
            ))}

            <ThemedView style={styles.parameterContainer}>
                <ThemedText>Target Value:</ThemedText>
                <TextInput
                    style={[styles.input, { color: textInputColor }]}
                    keyboardType={[IndicatorName.macd, IndicatorName.bbp].includes(signal.indicator.name) ? "default" : "numeric"}
                    returnKeyType="done"
                    value={formInput}
                    onChangeText={(text) => setFormInput(text)}
                    onBlur={() => {
                        let cleanedText = formInput.replace(/[^0-9.-]/g, '');
                        cleanedText = cleanedText.replace(/(?!^)-/g, '');
                        if ((cleanedText.match(/\./g) || []).length > 1) {
                            cleanedText = cleanedText.replace(/\.+$/, '');
                        }
            
                        let newNumber: number;
                        if ([IndicatorName.rsi, IndicatorName.adx, IndicatorName.so].includes(signal.indicator.name)) {  
                            cleanedText = cleanedText.replace(/-/g, '');
                            cleanedText = cleanedText.replace(/^(\d{0,2})(\.\d{0,4})?.*$/, '$1$2');
                            newNumber = cleanedText === "" ? 0 : parseFloat(cleanedText);
                        } else if ([IndicatorName.ema, IndicatorName.sma].includes(signal.indicator.name)) {
                            cleanedText = cleanedText.replace(/-/g, '');
                            cleanedText = cleanedText.replace(/^(\d{0,1})(\.\d{0,4})?.*$/, '$1$2');
                            newNumber = cleanedText === "" ? 0 : parseFloat(cleanedText);
                        } else {
                            newNumber = cleanedText === "" || cleanedText === "-" ? 0 : parseFloat(cleanedText);
                        }
            
                        setFormInput(newNumber.toString());
            
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
                        newSignals[indicatorIndex] = newSignal;
                        setSignals(newSignals);
                    }}
                />
            </ThemedView>


            <ThemedView style={styles.triggerText}>
                <ThemedText>Trigger when signal greater than or less than target?</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.buttonContainer}>
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
                        newSignals[indicatorIndex] = newSignal;
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
                        newSignals[indicatorIndex] = newSignal;
                        setSignals(newSignals);
                    }}/>
                </ThemedView>
            </ThemedView>

            <GeneralButton title="Save" onPress={validateInput}/>
            
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    signalContainer: {
        gap: 15,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    parameterContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20
    },

    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 100,
        marginBottom: 20
    },

    firstContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    },

    symbolContainer: {
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

    triggerText: {
        maxWidth: '80%', 
        alignSelf: 'center', 
        marginTop: 10
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

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },

    modalContainer: {
        padding: 20,
        borderRadius: 10,
        width: 250,
    },

    modalOption: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#ccc",
    }
})