import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet } from "react-native";
import { indicators, defaultParams, fastWindowString, signalWindowString, slowWindowString, targetValueString, windowString, IndicatorName } from "../enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useEffect, useState } from "react";
import { TextField } from "@/components/TextField";
import { SelectField } from "@/components/SelectField";
import { OptionModal } from "@/components/OptionModal";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Card } from "@/components/Card";
import { Spacing } from "@/constants/Theme";
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
    const { addToast } = useToast();
    const [modal, setModal] = useState<boolean>(false);
    const signal = signals[indicatorIndex];
    const [formInput, setFormInput] = useState<string>(String(signals[indicatorIndex]?.targetValue ?? ''));
    // Picking a different indicator resets the text box to that signal's target (React's pattern for resetting
    // state when an input changes: set it during the render, not in an effect).
    const [formIndicator, setFormIndicator] = useState<string>(signal.indicator.name);
    if (formIndicator !== signal.indicator.name) {
        setFormIndicator(signal.indicator.name);
        setFormInput(String(signal.targetValue));
    }

    const updateSignal = (changes: Partial<{
        indicator: typeof signal.indicator;
        targetValue: number;
        aboveTarget: boolean;
        window: number | null;
        fastWindow: number | null;
        slowWindow: number | null;
        signalWindow: number | null;
    }>) => {
        const merged = { ...signal, ...changes };
        const newSignal = new Signal(
            merged.indicator,
            merged.targetValue,
            merged.aboveTarget,
            merged.window,
            merged.fastWindow,
            merged.slowWindow,
            merged.signalWindow
        );
        const newSignals = [...signals];
        newSignals[indicatorIndex] = newSignal;
        setSignals(newSignals);
    };

    const maxWindow = 200;
    const validateInput = (targetValue: number) => {
        if (signal.window !== null && (signal.window < 1 || signal.window > maxWindow)) {
            addToast(`Window size must be between 1 and ${maxWindow}`);
            return;
        }

        if (
            [IndicatorName.rsi, IndicatorName.so, IndicatorName.adx].includes(signal.indicator.name)
        ) {
            if (targetValue <= 0 || targetValue >= 100) {
                addToast("Target value must be between 0 and 100, non-inclusive");
                return;
            }
        }

        if ([IndicatorName.sma, IndicatorName.ema].includes(signal.indicator.name)) {
            if (targetValue <= 0) {
                addToast("Target value must be greater than 0");
                return;
            } else if (targetValue <= 0.5 || targetValue >= 1.5) {
                addToast("Warning: Your target value is acceptable, but extreme. 1.0 is the default");
            }
        }

        if (signal.indicator.name === IndicatorName.bbp) {
            if (targetValue < -3.0 || targetValue > 3.0) {
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

        if (targetValue !== signal.targetValue) {
            updateSignal({ targetValue });
        }
        setIndicatorIndex(null);
    }
    
    const windowFields: { label: string; key: "window" | "fastWindow" | "slowWindow" | "signalWindow" }[] = [
        { label: windowString, key: "window" },
        { label: fastWindowString, key: "fastWindow" },
        { label: slowWindowString, key: "slowWindow" },
        { label: signalWindowString, key: "signalWindow" },
    ];

    const parseTargetValue = (): number => {
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

        return newNumber;
    };

    const commitTargetValue = () => {
        const newNumber = parseTargetValue();
        setFormInput(newNumber.toString());
        updateSignal({ targetValue: newNumber });
    };

    // Save must not rely on the field having blurred first: tapping a button does not blur a TextInput on Android.
    const saveSignal = () => {
        const newNumber = parseTargetValue();
        setFormInput(newNumber.toString());
        validateInput(newNumber);
    };

    return (
        <ThemedView style={styles.container}>
            <Card style={styles.card}>
                <SelectField
                    label="Indicator"
                    value={signal.indicator.displayName}
                    onPress={() => setModal(true)}
                />

                {windowFields.map(({ label, key }) => (
                    signal[key] !== null && (
                        <TextField
                            key={label}
                            label={label}
                            keyboardType="numeric"
                            returnKeyType="done"
                            value={String(signal[key])}
                            onChangeText={(text) => {
                                const cleanedText = text.replace(/\D/g, '').slice(0, 3);
                                const newNumber = cleanedText === '' ? 0 : parseInt(cleanedText, 10);
                                updateSignal({ [key]: newNumber });
                            }}
                        />
                    )
                ))}

                <TextField
                    label="Target value"
                    keyboardType={[IndicatorName.macd, IndicatorName.bbp].includes(signal.indicator.name) ? "default" : "numeric"}
                    returnKeyType="done"
                    value={formInput}
                    onChangeText={setFormInput}
                    onBlur={commitTargetValue}
                />

                <ThemedView style={styles.triggerGroup}>
                    <ThemedText type="muted" style={styles.triggerLabel}>Trigger when the signal is</ThemedText>
                    <SegmentedControl
                        options={[
                            { value: "above", label: "Greater than target" },
                            { value: "below", label: "Less than target" },
                        ]}
                        value={signal.aboveTarget ? "above" : "below"}
                        onChange={(value) => updateSignal({ aboveTarget: value === "above" })}
                    />
                </ThemedView>
            </Card>

            <GeneralButton title="Save" onPress={saveSignal} autoWidth={false} />

            <OptionModal
                visible={modal}
                title="Indicator"
                options={indicators.map((indicator) => ({ key: indicator.name, label: indicator.displayName }))}
                selectedKey={signal.indicator.name}
                onSelect={(key) => {
                    const indicator = indicators.find((i) => i.name === key);
                    if (!indicator) {
                        return;
                    }
                    updateSignal({
                        indicator,
                        targetValue: defaultParams[indicator.name][targetValueString] ?? 0,
                        aboveTarget: true,
                        window: defaultParams[indicator.name][windowString],
                        fastWindow: defaultParams[indicator.name][fastWindowString],
                        slowWindow: defaultParams[indicator.name][slowWindowString],
                        signalWindow: defaultParams[indicator.name][signalWindowString],
                    });
                }}
                onClose={() => setModal(false)}
            />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    card: {
        gap: Spacing.lg,
    },

    triggerGroup: {
        gap: Spacing.xs,
        backgroundColor: 'transparent',
    },

    triggerLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
});
