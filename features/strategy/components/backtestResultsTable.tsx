import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Spacing, Type, useTheme } from '@/constants/Theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BacktestResultsTableProps {
    percentReturn: number | null;
    percentReturnAdj: number | null;
    sharpeRatio: number | null;
    sharpeRatioAdj: number | null;
    sortinoRatio: number | null;
    sortinoRatioAdj: number | null;
}

export default function BacktestResultsTable({
    percentReturn,
    percentReturnAdj,
    sharpeRatio,
    sharpeRatioAdj,
    sortinoRatio,
    sortinoRatioAdj
}: BacktestResultsTableProps) {
    const theme = useTheme();

    const format = (value: number | null) => value !== null ? value.toFixed(2) : "-";
    const gainLossColor = (value: number | null) =>
        value === null ? theme.text : value >= 0 ? theme.gain : theme.loss;

    const rows: { label: string; baseline: number | null; adjusted: number | null; colored?: boolean }[] = [
        { label: "Percent gain", baseline: percentReturn, adjusted: percentReturnAdj, colored: true },
        { label: "Sharpe ratio", baseline: sharpeRatio, adjusted: sharpeRatioAdj },
        { label: "Sortino ratio", baseline: sortinoRatio, adjusted: sortinoRatioAdj },
    ];

    return (
        <Card style={styles.card}>
            <View style={[styles.row, styles.headerRow, { borderColor: theme.border }]}>
                <View style={styles.labelCell} />
                <ThemedText type="muted" style={[styles.valueCell, styles.headerText]}>vs. 0% returns</ThemedText>
                <ThemedText type="muted" style={[styles.valueCell, styles.headerText]}>vs. asset returns</ThemedText>
            </View>

            {rows.map((row, index) => (
                <View
                    key={row.label}
                    style={[
                        styles.row,
                        index < rows.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                >
                    <ThemedText type="defaultSemiBold" style={styles.labelCell}>{row.label}</ThemedText>
                    <ThemedText style={[styles.valueCell, styles.value, row.colored && { color: gainLossColor(row.baseline) }]}>
                        {format(row.baseline)}
                    </ThemedText>
                    <ThemedText style={[styles.valueCell, styles.value, row.colored && { color: gainLossColor(row.adjusted) }]}>
                        {format(row.adjusted)}
                    </ThemedText>
                </View>
            ))}

            <ThemedText type="muted" style={styles.noteText}>All values are annualized</ThemedText>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: Spacing.sm,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },

    headerRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingVertical: Spacing.sm,
    },

    headerText: {
        ...Type.caption,
        fontWeight: '600',
    },

    labelCell: {
        flex: 3,
    },

    valueCell: {
        flex: 2,
        textAlign: 'right',
    },

    value: {
        ...Type.bodyStrong,
    },

    noteText: {
        ...Type.caption,
        textAlign: 'center',
        paddingTop: Spacing.sm,
    },
});
