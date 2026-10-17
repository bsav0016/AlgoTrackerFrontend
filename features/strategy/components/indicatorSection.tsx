import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { Card } from "@/components/Card";
import { Ionicons } from "@expo/vector-icons";
import { MIN_TOUCH, Radius, Spacing, Type, useTheme } from "@/constants/Theme";

interface SignalSectionProps {
    sectionTitle: string;
    signals: Signal[];
    setSignals: (signals: Signal[]) => void;
    buttonText: string;
    buttonAction: () => void;
    setIndicatorIndex: (index: number) => void;
    tone: "gain" | "loss";
}

export function IndicatorSection({
    sectionTitle,
    signals,
    setSignals,
    buttonText,
    buttonAction,
    setIndicatorIndex,
    tone
}: SignalSectionProps) {
    const theme = useTheme();

    const deleteIndicator = (index: number) => {
        const newSignals: Signal[] = signals.filter((_, i) => i !== index);
        setSignals(newSignals);
    }

    const signalParameterString = (signal: Signal) => {
        const windows = [signal.window, signal.fastWindow, signal.slowWindow, signal.signalWindow]
            .filter((value) => value);
        const target = `${signal.aboveTarget ? "Above" : "Below"} ${signal.targetValue}`;
        return windows.length > 0 ? `Window ${windows.join("/")} · ${target}` : target;
    }

    return (
        <ThemedView style={styles.section}>
            <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: tone === "gain" ? theme.gain : theme.loss }]} />
                <ThemedText style={styles.title}>{sectionTitle}</ThemedText>
            </View>

            {signals.map((signal, index) => (
                <Card key={index} style={styles.signalCard}>
                    <View style={styles.signalInfo}>
                        <ThemedText type="defaultSemiBold">{signal.indicator.displayName}</ThemedText>
                        <ThemedText type="muted" style={styles.parameterText}>{signalParameterString(signal)}</ThemedText>
                    </View>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setIndicatorIndex(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${signal.indicator.displayName}`}
                    >
                        <Ionicons name="create-outline" size={22} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => deleteIndicator(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${signal.indicator.displayName}`}
                    >
                        <Ionicons name="trash-outline" size={22} color={theme.danger} />
                    </TouchableOpacity>
                </Card>
            ))}

            {signals.length < 3 &&
                <GeneralButton title={buttonText} variant="ghost" onPress={buttonAction} autoWidth={false} />
            }
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.sm,
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: Radius.pill,
    },

    title: {
        ...Type.subtitle,
    },

    signalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingLeft: Spacing.lg,
        paddingRight: Spacing.sm,
    },

    signalInfo: {
        flex: 1,
    },

    parameterText: {
        fontSize: 14,
    },

    iconButton: {
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
