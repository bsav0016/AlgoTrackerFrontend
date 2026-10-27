import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GeneralButton } from "@/components/GeneralButton";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { StrategyService } from "@/features/strategy/StrategyService";
import { PositionMapping } from "@/features/strategy/classes/Strategy";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, Type, useTheme } from "@/constants/Theme";


export default function ViewStrategy() {
    const { strategy, setStrategy } = useStrategy();
    const { accessToken } = useAuth()
    const { routeBack } = useRouteTo();
    const { addToast } = useToast();
    const theme = useTheme();

    if (!strategy) {
        addToast("Could not load strategy. Returning home...");
        routeBack();
        return;
    }

    const toPercent = (value: number): number => (value - 1) * 100;

    const formatPercent = (value: number): string => {
        const percent = toPercent(value);
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    }

    const returnColor = (value: number): string => toPercent(value) >= 0 ? theme.gain : theme.loss;

    // Daily and longer candles carry no meaningful time of day (and are stamped in UTC), so show the date only.
    const isDailyOrLonger = /day|week|month/i.test(strategy.interval);

    const formattedDate = (date: Date): string => {
        if (isDailyOrLonger) {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
            });
        }
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    const formattedPrice = (price: number): string => {
        return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const confirmStopStrategy = () => {
        addToast("This will stop your strategy and remove it altogether. Would you like to proceed?", [{
            label: 'Yes',
            callback: () => stopStrategy()
        }])
    }

    const stopStrategy = async () => {
        if (!accessToken) {
            addToast("Error stopping strategy. Please contact the support team");
            return;
        }
        await StrategyService.unsubscribeStrategy(strategy, accessToken);
        setStrategy(null);
        routeBack();
    }

    return (
        <CustomHeaderView header={strategy.title}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <ThemedText type="muted">{`${strategy.symbol} · ${strategy.interval}`}</ThemedText>
                        <Badge
                            label={PositionMapping[strategy.position] ?? "Hold"}
                            tone={strategy.position < 1 ? "loss" : strategy.position > 2 ? "gain" : "neutral"}
                        />
                    </View>

                    <View style={styles.metrics}>
                        <View style={styles.metric}>
                            <ThemedText type="muted" style={styles.metricLabel}>Strategy return</ThemedText>
                            <ThemedText style={[styles.metricValue, { color: returnColor(strategy.strategyReturn) }]}>
                                {formatPercent(strategy.strategyReturn)}
                            </ThemedText>
                        </View>
                        <View style={styles.metric}>
                            <ThemedText type="muted" style={styles.metricLabel}>Asset return</ThemedText>
                            <ThemedText style={[styles.metricValue, { color: returnColor(strategy.assetReturn) }]}>
                                {formatPercent(strategy.assetReturn)}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.renewRow, { borderColor: theme.border }]}>
                        <ThemedText type="muted" style={styles.renewLabel}>Next charge in</ThemedText>
                        <CountdownTimer key={strategy.chargeUserDate.getTime()} endsAt={strategy.chargeUserDate} />
                    </View>

                    <View style={[styles.renewRow, styles.checkedRow, { borderColor: theme.border }]}>
                        <ThemedText type="muted" style={styles.renewLabel}>Last candle checked</ThemedText>
                        <ThemedText style={styles.checkedValue}>
                            {strategy.lastProcessedAt ? formattedDate(strategy.lastProcessedAt) : "Waiting for the first candle"}
                        </ThemedText>
                    </View>
                </Card>

                <ThemedText style={styles.sectionTitle}>
                    {`Trades${strategy.trades.length > 0 ? ` (${strategy.trades.length})` : ""}`}
                </ThemedText>

                {strategy.trades.length > 0 ?
                    <Card style={styles.tradesCard}>
                        <View style={[styles.tradeRow, styles.tradeHeaderRow, { borderColor: theme.border }]}>
                            <ThemedText type="muted" style={[styles.dateCell, styles.headerText]}>Date</ThemedText>
                            <ThemedText type="muted" style={[styles.priceCell, styles.headerText]}>Price</ThemedText>
                            <ThemedText type="muted" style={[styles.actionCell, styles.headerText]}>Action</ThemedText>
                        </View>

                        {strategy.trades.map((trade, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.tradeRow,
                                    index < strategy.trades.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                                ]}
                            >
                                <ThemedText style={styles.dateCell}>{formattedDate(trade.date)}</ThemedText>
                                <ThemedText style={styles.priceCell}>{formattedPrice(trade.price)}</ThemedText>
                                <View style={styles.actionCell}>
                                    <Badge label={trade.isBuy ? "Buy" : "Sell"} tone={trade.isBuy ? "gain" : "loss"} />
                                </View>
                            </View>
                        ))}
                    </Card>
                    :
                    <EmptyState title="No trades yet" message="Trades appear here when your signals trigger." />
                }

                <View style={styles.stopSection}>
                    <GeneralButton title="Stop Strategy" variant="danger" onPress={confirmStopStrategy} autoWidth={false} />
                </View>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    summaryCard: {
        gap: Spacing.lg,
    },

    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    metrics: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },

    metric: {
        flex: 1,
        gap: Spacing.xs,
    },

    metricLabel: {
        ...Type.caption,
        fontWeight: '600',
    },

    metricValue: {
        ...Type.title,
    },

    renewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: Spacing.md,
    },

    renewLabel: {
        fontSize: 14,
    },

    checkedRow: {
        gap: Spacing.md,
    },

    checkedValue: {
        fontSize: 14,
        flexShrink: 1,
        textAlign: 'right',
    },

    sectionTitle: {
        ...Type.subtitle,
    },

    tradesCard: {
        paddingVertical: Spacing.sm,
    },

    tradeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },

    tradeHeaderRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingVertical: Spacing.sm,
    },

    headerText: {
        ...Type.caption,
        fontWeight: '600',
    },

    dateCell: {
        flex: 3,
    },

    priceCell: {
        flex: 2,
        textAlign: 'right',
    },

    actionCell: {
        flex: 2,
        alignItems: 'flex-start',
    },

    stopSection: {
        marginTop: Spacing.lg,
    },
})
