import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Spacing, Type, useTheme } from '@/constants/Theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { DataWindowFormat } from '../classes/Backtest';

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function truncationMessage(window: DataWindowFormat): string | null {
    if (!window.truncated) return null;
    return window.reason === 'request_limit'
        ? "The data limit was reached before the whole period was loaded, so this test covers a shorter period than you asked for. Try a shorter period or a longer interval."
        : "Price history for this symbol does not go back as far as the start date you chose, so this test covers a shorter period.";
}

export default function BacktestCoverage({ window }: { window: DataWindowFormat }) {
    const theme = useTheme();
    const warning = truncationMessage(window);

    return (
        <Card style={styles.card}>
            <ThemedText type="defaultSemiBold">Period covered</ThemedText>
            <ThemedText>{`${day(window.covered_start)} to ${day(window.covered_end)} (${window.candles} candles)`}</ThemedText>
            {warning && <ThemedText style={[styles.warning, { color: theme.loss }]}>{`Shorter than requested. ${warning}`}</ThemedText>}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: Spacing.xs,
    },
    warning: {
        ...Type.caption,
    },
});
