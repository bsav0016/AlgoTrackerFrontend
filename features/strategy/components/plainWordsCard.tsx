import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import { PlainNumbers, plainWordsRows } from "../plainWords";

/** The backtest in words anyone can read: how far it fell, how many trades made money, how long it was invested. */
export default function PlainWordsCard({ numbers }: { numbers: PlainNumbers }) {
    const theme = useTheme();
    const rows = plainWordsRows(numbers);
    if (rows.length === 0) return null;

    return (
        <View style={styles.wrapper}>
            <ThemedText style={styles.title}>In plain words</ThemedText>
            <Card style={styles.card}>
                {rows.map((row, index) => (
                    <View
                        key={row.key}
                        style={[styles.row, index < rows.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    >
                        <View style={styles.line}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>{row.label}</ThemedText>
                            <ThemedText style={styles.value}>{row.value}</ThemedText>
                        </View>
                        {row.detail !== "" && <ThemedText type="muted" style={styles.detail}>{row.detail}</ThemedText>}
                    </View>
                ))}
                <ThemedText type="muted" style={styles.note}>
                    After trading costs. Past results are not a prediction of future results.
                </ThemedText>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: Spacing.sm,
    },

    title: {
        ...Type.subtitle,
    },

    card: {
        paddingVertical: Spacing.sm,
    },

    row: {
        paddingVertical: Spacing.md,
        gap: Spacing.xs,
    },

    line: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: Spacing.md,
    },

    label: {
        flexShrink: 1,
    },

    value: {
        ...Type.bodyStrong,
        textAlign: "right",
        flexShrink: 1,
    },

    detail: {
        fontSize: 14,
        lineHeight: 20,
    },

    note: {
        ...Type.caption,
        textAlign: "center",
        paddingTop: Spacing.sm,
    },
});
