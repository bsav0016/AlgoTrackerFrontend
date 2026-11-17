import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Spacing, Type, useTheme } from '@/constants/Theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { DataWindowFormat } from '../classes/Backtest';
import { formatDay } from '../chart/chartMath';

// Candles are stamped in UTC (a daily candle is midnight UTC), so the dates are read in UTC too. In the phone's own
// time zone a daily candle shows as the day before for anyone west of Greenwich, and disagrees with the chart.
const day = (iso: string) => formatDay(new Date(iso).getTime());

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
