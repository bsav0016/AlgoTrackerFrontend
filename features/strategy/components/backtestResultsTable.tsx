import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet } from 'react-native';

interface BacktestResultsTableProps {
    percentReturn: number | null;
    percentReturnAdj: number | null;
    sharpeRatio: number | null;
    sharpeRatioAdj: number | null;
    sortinoRatio: number | null;
    sortinoRatioAdj: number | null;
}

const desiredCellPadding = 6

export default function BacktestResultsTable({
    percentReturn,
    percentReturnAdj,
    sharpeRatio,
    sharpeRatioAdj,
    sortinoRatio,
    sortinoRatioAdj
}: BacktestResultsTableProps) {
    const borderColor = useThemeColor({}, "text");
    return (
        <ThemedView>
            <ThemedView style={[styles.tableContainer, { borderColor: borderColor }]}>
                <ThemedView style={[styles.row, { borderColor: borderColor}]}>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}> </ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText, { flex: 2, paddingHorizontal: desiredCellPadding * 2 }]}>Baseline</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.row, { borderColor: borderColor}]}>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}> </ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText, { borderColor: borderColor }]}>vs. 0% Returns</ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText, { borderColor: borderColor }]}>vs. Asset Returns</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.row, { borderColor: borderColor}]}>
                    <ThemedText style={[styles.cell, styles.boldText, { borderColor: borderColor }]}>Percent Gain</ThemedText>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}>
                        {percentReturn !== null ? percentReturn.toFixed(2) : "-"}
                    </ThemedText>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}>
                        {percentReturnAdj !== null ? percentReturnAdj.toFixed(2) : "-"}
                    </ThemedText>
                </ThemedView>
                <ThemedView style={[styles.row, { borderColor: borderColor}]}>
                    <ThemedText style={[styles.cell, styles.boldText, { borderColor: borderColor }]}>Sharpe Ratio</ThemedText>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}>
                        {sharpeRatio !== null ? sharpeRatio.toFixed(2) : "-"}
                    </ThemedText>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}>
                        {sharpeRatioAdj !== null ? sharpeRatioAdj.toFixed(2) : "-"}
                    </ThemedText>
                </ThemedView>
                <ThemedView style={[styles.row, { borderColor: borderColor}]}>
                    <ThemedText style={[styles.cell, styles.boldText, { borderColor: borderColor }]}>Sortino Ratio</ThemedText>
                    <ThemedText style={[styles.cell, { borderColor: borderColor }]}>
                        {sortinoRatio !== null ? sortinoRatio.toFixed(2) : "-"}
                    </ThemedText>
                    <ThemedText style={styles.cell}>
                        {sortinoRatioAdj !== null ? sortinoRatioAdj.toFixed(2) : "-"}
                    </ThemedText>
                </ThemedView>
            </ThemedView>
            <ThemedText style={styles.noteText}>**All values are annualized**</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    tableContainer: {
        margin: 10,
        borderWidth: 1,
        borderRadius: 4,
    },

    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },

    cell: {
        flex: 1,
        textAlign: 'center',
        padding: desiredCellPadding,
        borderRightWidth: 1,
        height: '100%'
    },

    boldText: {
        fontWeight: 600
    },

    noteText: {
        textAlign: 'center'
    }
});
