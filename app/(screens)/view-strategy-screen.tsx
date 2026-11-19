import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import React, { useState } from "react";
import { Dimensions, Platform, ScrollView, Share, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GeneralButton } from "@/components/GeneralButton";
import { Card } from "@/components/Card";
import { describeExitRules, exitReasonLabel } from "@/features/strategy/classes/ExitRules";
import { describeSignal } from "@/features/sharing/SharedStrategy";
import { describeEditRecord, tradeRows } from "@/features/strategy/strategyEdit";
import { Routes } from "@/app/Routes";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { StrategyService } from "@/features/strategy/StrategyService";
import { PositionMapping } from "@/features/strategy/classes/Strategy";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { ShareService } from "@/features/sharing/ShareService";
import { SHARE_DISCLAIMER, shareUrl, sharePayload } from "@/features/sharing/ShareLink";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";
import { LiveCurveChart } from "@/features/strategy/chart/LiveCurveChart";

// Card padding (Spacing.lg + Spacing.md on each side) plus the card border; the chart is about 2:1.3.
const CURVE_WIDTH = Dimensions.get("window").width - 2 * (Spacing.lg + Spacing.md) - 2;
const CURVE_HEIGHT = Math.round(CURVE_WIDTH * 0.62);


export default function ViewStrategy() {
    const { strategy, setStrategy } = useStrategy();
    const { accessToken } = useAuth()
    const { updateUserData } = useUser();
    const [busy, setBusy] = useState<boolean>(false);
    const { routeBack, routeTo } = useRouteTo();
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

    const shareStrategy = async () => {
        if (!accessToken) {
            addToast("Please sign in first");
            return;
        }
        try {
            const url = shareUrl(await ShareService.createShare(strategy.id, accessToken));
            await Share.share(sharePayload(strategy.title, url, Platform.OS));
        } catch {
            addToast("Could not create the share link. Please try again");
        }
    }

    const confirmStopSharing = () => {
        addToast("Anyone who has your link will no longer be able to open it. Turn the link off?", [{
            label: 'Yes',
            callback: () => stopSharing()
        }])
    }

    const stopSharing = async () => {
        if (!accessToken) {
            addToast("Please sign in first");
            return;
        }
        try {
            await ShareService.revokeShare(strategy.id, accessToken);
            addToast("The link is turned off");
        } catch {
            addToast("Could not turn the link off. Please try again");
        }
    }

    const startTracking = async () => {
        if (!accessToken) {
            addToast("Please sign in first");
            return;
        }
        setBusy(true);
        try {
            setStrategy(await ShareService.activate(strategy.id, accessToken));
            await updateUserData(accessToken);
            addToast("Tracking started. You will get a notification when it signals.");
        } catch {
            addToast("Could not start tracking. Please try again");
        } finally {
            setBusy(false);
        }
    }

    return (
        <CustomHeaderView header={strategy.title}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <ThemedText type="muted">{`${strategy.symbol} · ${strategy.interval}`}</ThemedText>
                        {strategy.active ?
                            <Badge
                                label={PositionMapping[strategy.position] ?? "Hold"}
                                tone={strategy.position < 1 ? "loss" : strategy.position > 2 ? "gain" : "neutral"}
                            />
                            :
                            <Badge label="Draft" tone="neutral" />
                        }
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

                    {strategy.active ?
                        <>
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
                        </>
                        :
                        <View style={[styles.renewRow, { borderColor: theme.border }]}>
                            <ThemedText type="muted" style={styles.renewLabel}>
                                This is a draft. It is not tracked or charged until you start it, and then the first monthly charge is 30 days away.
                            </ThemedText>
                        </View>
                    }
                </Card>

                <ThemedText style={styles.sectionTitle}>Rules</ThemedText>
                <Card style={styles.rulesCard}>
                    <ThemedText type="defaultSemiBold">Buy when</ThemedText>
                    {strategy.buySignals.length > 0
                        ? strategy.buySignals.map((signal, index) => <ThemedText key={`b${index}`}>{describeSignal(signal)}</ThemedText>)
                        : <ThemedText type="muted">No buy rules</ThemedText>}
                    <ThemedText type="defaultSemiBold" style={styles.rulesGap}>Sell when</ThemedText>
                    {strategy.sellSignals.length > 0
                        ? strategy.sellSignals.map((signal, index) => <ThemedText key={`s${index}`}>{describeSignal(signal)}</ThemedText>)
                        : <ThemedText type="muted">No sell rules: it buys and holds</ThemedText>}
                    {strategy.rulesChangedAt !== null &&
                        <ThemedText type="muted" style={styles.rulesGap}>
                            {`Rules last changed ${formattedDate(strategy.rulesChangedAt)}. The leaderboard counts results from then.`}
                        </ThemedText>
                    }
                </Card>

                {describeExitRules(strategy.exitRules).length > 0 &&
                    <>
                        <ThemedText style={styles.sectionTitle}>Exit rules</ThemedText>
                        <Card>
                            {describeExitRules(strategy.exitRules).map((line) => (
                                <ThemedText key={line}>{line}</ThemedText>
                            ))}
                        </Card>
                    </>
                }

                <ThemedText style={styles.sectionTitle}>Strategy curve</ThemedText>
                {strategy.equityCurve.length >= 2 ?
                    <Card style={styles.curveCard}>
                        <LiveCurveChart curve={strategy.equityCurve} trades={strategy.trades} width={CURVE_WIDTH} height={CURVE_HEIGHT} />
                        <ThemedText type="muted" style={styles.curveNote}>
                            {"The strategy's value since its first buy, after its trades closed. The asset's return is the total above."}
                        </ThemedText>
                    </Card>
                    :
                    <EmptyState
                        title="No curve yet"
                        message={strategy.active
                            ? "The curve appears once your strategy has bought, and grows as it trades."
                            : "Start tracking to see the strategy's curve."}
                    />
                }

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

                        {tradeRows(strategy.trades, strategy.edits).map((row, position, rows) => row.kind === "edit" ? (
                            <View key={`e${position}`} style={[styles.editRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                <ThemedText type="muted" style={styles.editText}>
                                    {`${formattedDate(row.edit.date)} · ${describeEditRecord(row.edit)}`}
                                </ThemedText>
                            </View>
                        ) : (
                            <View
                                key={row.index}
                                style={[
                                    styles.tradeRow,
                                    position < rows.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                                ]}
                            >
                                <ThemedText style={styles.dateCell}>{formattedDate(row.trade.date)}</ThemedText>
                                <ThemedText style={styles.priceCell}>{formattedPrice(row.trade.price)}</ThemedText>
                                <View style={styles.actionCell}>
                                    <Badge label={row.trade.isBuy ? "Buy" : exitReasonLabel(row.trade.exitReason) ?? "Sell"} tone={row.trade.isBuy ? "gain" : "loss"} />
                                </View>
                            </View>
                        ))}
                    </Card>
                    :
                    <EmptyState title="No trades yet" message="Trades appear here when your signals trigger." />
                }

                <View style={styles.stopSection}>
                    {!strategy.active &&
                        <GeneralButton title="Start tracking" onPress={startTracking} loading={busy} disabled={busy} autoWidth={false} />
                    }
                    <GeneralButton title="Edit rules" variant="outline" onPress={() => routeTo(Routes.EditStrategy)} autoWidth={false} />
                    <GeneralButton title="Share" variant="outline" onPress={shareStrategy} autoWidth={false} />
                    <GeneralButton title="Stop sharing" variant="ghost" onPress={confirmStopSharing} autoWidth={false} />
                    <ThemedText type="muted" style={styles.shareNote}>{SHARE_DISCLAIMER}</ThemedText>
                    <GeneralButton title={strategy.active ? "Stop Strategy" : "Delete draft"} variant="danger" onPress={confirmStopStrategy} autoWidth={false} />
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

    curveCard: {
        gap: Spacing.sm,
        padding: Spacing.md,
    },

    curveNote: {
        fontSize: 13,
        paddingTop: Spacing.xs,
    },

    rulesCard: {
        gap: Spacing.xs,
    },

    rulesGap: {
        paddingTop: Spacing.sm,
    },

    editRow: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        marginVertical: Spacing.xs,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: Radius.sm,
    },

    editText: {
        fontSize: 13,
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
        gap: Spacing.sm,
    },

    shareNote: {
        ...Type.caption,
        textAlign: 'center',
    },
})
