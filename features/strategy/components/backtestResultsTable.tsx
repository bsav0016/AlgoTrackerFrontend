import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
    return (
        <ThemedView>
            <ThemedView style={styles.tableContainer}>
                <ThemedView style={styles.row}>
                    <ThemedText style={styles.cell}> </ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText, { flex: 2, paddingHorizontal: desiredCellPadding * 2 }]}>Baseline</ThemedText>
                </ThemedView>
                <ThemedView style={styles.row}>
                    <ThemedText style={styles.cell}> </ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText]}>0% Returns</ThemedText>
                    <ThemedText style={[styles.cell, styles.boldText]}>Asset Returns</ThemedText>
                </ThemedView>
                <ThemedView style={styles.row}>
                    <ThemedText style={[styles.cell, styles.boldText]}>Percent Gain</ThemedText>
                    <ThemedText style={styles.cell}>
                        {percentReturn !== null ? percentReturn.toFixed(2) : "-"}
                    </ThemedText>
                    <ThemedText style={styles.cell}>
                        {percentReturnAdj !== null ? percentReturnAdj.toFixed(2) : "-"}
                    </ThemedText>
                </ThemedView>
                <ThemedView style={styles.row}>
                    <ThemedText style={[styles.cell, styles.boldText]}>Sharpe Ratio</ThemedText>
                    <ThemedText style={styles.cell}>
                        {sharpeRatio !== null ? sharpeRatio.toFixed(2) : "-"}
                    </ThemedText>
                    <ThemedText style={styles.cell}>
                        {sharpeRatioAdj !== null ? sharpeRatioAdj.toFixed(2) : "-"}
                    </ThemedText>
                </ThemedView>
                <ThemedView style={styles.row}>
                    <ThemedText style={[styles.cell, styles.boldText]}>Sortino Ratio</ThemedText>
                    <ThemedText style={styles.cell}>
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
