import { useEffect, useState } from "react";
import { Keyboard, Modal, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";
import { MAX_LABEL_LENGTH } from "../BacktestHistoryService";

interface RenameBacktestModalProps {
    visible: boolean;
    initialLabel: string;
    saving: boolean;
    onSave: (label: string) => void;
    onClose: () => void;
}

/** A small dialog to name a saved backtest. Leaving it empty goes back to the symbol and interval. */
export function RenameBacktestModal({ visible, initialLabel, saving, onSave, onClose }: RenameBacktestModalProps) {
    const theme = useTheme();
    const [label, setLabel] = useState(initialLabel);

    useEffect(() => {
        if (visible) setLabel(initialLabel);
    }, [visible, initialLabel]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ThemedText style={styles.title}>Name this backtest</ThemedText>
                        <TextField
                            label="Name"
                            placeholder="For example: RSI with a stop"
                            value={label}
                            onChangeText={setLabel}
                            maxLength={MAX_LABEL_LENGTH}
                            returnKeyType="done"
                            autoFocus
                            onSubmitEditing={() => onSave(label)}
                        />
                        <View style={styles.buttons}>
                            <View style={styles.button}>
                                <GeneralButton title="Cancel" variant="secondary" onPress={onClose} disabled={saving} autoWidth={false} />
                            </View>
                            <View style={styles.button}>
                                <GeneralButton title="Save" onPress={() => onSave(label)} loading={saving} disabled={saving} autoWidth={false} />
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        padding: Spacing.xl,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    sheet: {
        borderRadius: Radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    title: {
        ...Type.subtitle,
    },

    buttons: {
        flexDirection: "row",
        gap: Spacing.md,
    },

    button: {
        flex: 1,
    },
});
