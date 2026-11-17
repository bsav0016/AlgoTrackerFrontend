import { useEffect, useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Card } from "@/components/Card";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { CompareChart, RUN_B_COLOR } from "@/features/strategy/chart/CompareChart";
import {
    CompareRow, compareRows, describeDifferences, differenceTone, formatCell, formatDifference, planCompare, runSubtitle,
    runSummary, runTitle,
} from "@/features/strategy/compare";

// Card padding (Spacing.lg + Spacing.md on each side) plus the card border; the chart is about 2:1.6.
const CHART_WIDTH = Dimensions.get("window").width - 2 * (Spacing.lg + Spacing.md) - 2;
const CHART_HEIGHT = Math.round(CHART_WIDTH * 0.62);

export default function CompareBacktestsScreen() {
    const { compareRuns } = useBacktest();
    const { addToast } = useToast();
    const { routeBack } = useRouteTo();
    const theme = useTheme();

    useEffect(() => {
        if (!compareRuns) {
            addToast("Could not load the two backtests");
            routeBack();
        }
    }, [compareRuns, addToast, routeBack]);

    const plan = useMemo(() => (compareRuns ? planCompare(compareRuns.a, compareRuns.b) : null), [compareRuns]);
    const rows = useMemo(() => (compareRuns ? compareRows(compareRuns.a, compareRuns.b) : []), [compareRuns]);
    const differences = useMemo(() => (compareRuns ? describeDifferences(compareRuns.a, compareRuns.b) : []), [compareRuns]);

    const toneColor = (row: CompareRow) => {
        const tone = differenceTone(row);
        return tone === "gain" ? theme.gain : tone === "loss" ? theme.loss : theme.mutedText;
    };

    if (!compareRuns || !plan) {
        return <CustomHeaderView header="Compare backtests" displayFunds={false}><View /></CustomHeaderView>;
    }

    return (
        <CustomHeaderView header="Compare backtests" displayFunds={false}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <ThemedText type="defaultSemiBold">Strategy A vs. B</ThemedText>
                    <CompareChart plan={plan} width={CHART_WIDTH} height={CHART_HEIGHT} />
                    {plan.mode === "elapsed" && (
                        <ThemedText type="muted" style={styles.note}>
                            These runs are on different markets or periods, so both start at day 0 and the holding line is left out.
                        </ThemedText>
                    )}
                </Card>

                <Card style={styles.card}>
                    <RunKey letter="A" color={theme.primary} title={runTitle(compareRuns.a)} summary={runSummary(compareRuns.a)} subtitle={runSubtitle(compareRuns.a)} />
                    <RunKey letter="B" color={RUN_B_COLOR} title={runTitle(compareRuns.b)} summary={runSummary(compareRuns.b)} subtitle={runSubtitle(compareRuns.b)} />
                </Card>

                <ThemedText style={styles.sectionTitle}>What is different</ThemedText>
                <Card style={styles.card}>
                    {differences.length === 0 ? (
                        <ThemedText type="muted">These two runs used the same settings.</ThemedText>
                    ) : (
                        differences.map((difference) => (
                            <View key={difference.label} style={styles.difference}>
                                <ThemedText type="defaultSemiBold">{difference.label}</ThemedText>
                                <ThemedText style={styles.differenceLine}>{`A: ${difference.a}`}</ThemedText>
                                <ThemedText style={styles.differenceLine}>{`B: ${difference.b}`}</ThemedText>
                            </View>
                        ))
                    )}
                </Card>

                <ThemedText style={styles.sectionTitle}>The numbers</ThemedText>
                <Card style={styles.card}>
                    <View style={[styles.row, styles.headerRow, { borderColor: theme.border }]}>
                        <View style={styles.labelCell} />
                        <ThemedText type="muted" style={[styles.valueCell, styles.headerText]}>A</ThemedText>
                        <ThemedText type="muted" style={[styles.valueCell, styles.headerText]}>B</ThemedText>
                        <ThemedText type="muted" style={[styles.valueCell, styles.headerText]}>B − A</ThemedText>
                    </View>
                    {rows.map((row, index) => (
                        <View
                            key={row.label}
                            style={[styles.row, index < rows.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                        >
                            <ThemedText type="defaultSemiBold" style={styles.labelCell}>{row.label}</ThemedText>
                            <ThemedText style={[styles.valueCell, styles.value]}>{formatCell(row.kind, row.a)}</ThemedText>
                            <ThemedText style={[styles.valueCell, styles.value]}>{formatCell(row.kind, row.b)}</ThemedText>
                            <ThemedText style={[styles.valueCell, styles.value, { color: toneColor(row) }]}>
                                {formatDifference(row) ?? "-"}
                            </ThemedText>
                        </View>
                    ))}
                    <ThemedText type="muted" style={styles.note}>
                        Gains are after trading costs. The difference between two gains is in percentage points. Past results are not a
                        prediction of future results.
                    </ThemedText>
                </Card>
            </ScrollView>
        </CustomHeaderView>
    );
}

function RunKey({ letter, color, title, summary, subtitle }: { letter: string; color: string; title: string; summary: string; subtitle: string }) {
    return (
        <View style={styles.key}>
            <View style={[styles.badge, { backgroundColor: color }]}>
                <ThemedText style={styles.badgeText}>{letter}</ThemedText>
            </View>
            <View style={styles.keyText}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{title}</ThemedText>
                {summary !== "" && <ThemedText style={styles.summary}>{summary}</ThemedText>}
                {subtitle !== "" && <ThemedText type="muted" style={styles.small}>{subtitle}</ThemedText>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    card: {
        gap: Spacing.sm,
        padding: Spacing.md,
    },

    sectionTitle: {
        ...Type.subtitle,
    },

    note: {
        fontSize: 13,
        textAlign: "center",
        paddingTop: Spacing.sm,
    },

    key: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },

    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    badgeText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
        lineHeight: 18,
    },

    keyText: {
        flex: 1,
    },

    small: {
        fontSize: 13,
    },

    summary: {
        fontSize: 15,
    },

    difference: {
        gap: 2,
        paddingVertical: Spacing.xs,
    },

    differenceLine: {
        fontSize: 15,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },

    headerRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingVertical: Spacing.sm,
    },

    headerText: {
        ...Type.caption,
        fontWeight: "600",
    },

    labelCell: {
        flex: 3,
    },

    valueCell: {
        flex: 2,
        textAlign: "right",
    },

    value: {
        fontSize: 15,
        fontWeight: "600",
    },
});
