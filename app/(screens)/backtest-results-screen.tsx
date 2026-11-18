import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Switch, StyleSheet, ScrollView, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, useTheme } from "@/constants/Theme";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Routes } from "@/app/Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import BacktestResultsTable from "@/features/strategy/components/backtestResultsTable";
import BacktestCoverage from "@/features/strategy/components/backtestCoverage";
import PlainWordsCard from "@/features/strategy/components/plainWordsCard";
import { BacktestChart } from "@/features/strategy/chart/BacktestChart";
import { formatDay } from "@/features/strategy/chart/chartMath";


// Card padding (Spacing.lg + Spacing.md on each side) plus the card border; the chart is about 2:1.
const CHART_WIDTH = Dimensions.get("window").width - 2 * (Spacing.lg + Spacing.md) - 2;
const CHART_HEIGHT = Math.round(CHART_WIDTH * 0.62);

export default function BacktestResults() {
    const { backtestData, setBacktestData, setRerunFrom } = useBacktest(); 
    const { addToast } = useToast();
    const { routeTo, routeReplace } = useRouteTo();
    const theme = useTheme();
    const [displaySignals, setDisplaySignals] = useState(true);
    // Set when handing over to the builder: the results are cleared on the way, which must not look like a failure here.
    const handingToBuilder = useRef(false);

    const points = useMemo(() => backtestData?.chartPoints() ?? [], [backtestData]);

    useEffect(() => {
        if (handingToBuilder.current) return;
        if (!backtestData) {
            addToast("Could not properly retrieve backtest data");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }

        if (backtestData.chartPoints().length === 0) {
            addToast("Could not properly load backtest result");
            routeTo(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
            return;
        }
    }, [backtestData]);

    return (
        <CustomHeaderView header="Backtest Results">
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <ThemedText type="defaultSemiBold">Strategy vs. asset</ThemedText>
                        <View style={styles.toggle}>
                            <ThemedText type="muted" style={styles.toggleLabel}>Signals</ThemedText>
                            <Switch
                                value={displaySignals}
                                onValueChange={(value) => setDisplaySignals(value)}
                                trackColor={{ true: theme.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>

                    {points.length > 0 ? (
                        <BacktestChart
                            points={points}
                            trades={backtestData?.strategy.trades ?? []}
                            showSignals={displaySignals}
                            width={CHART_WIDTH}
                            height={CHART_HEIGHT}
                        />
                    ) : (
                        <ThemedText type="muted">No chart available</ThemedText>
                    )}
                </Card>

                {backtestData && (
                    <View style={styles.rerun}>
                        <GeneralButton
                            title="Tweak and rerun"
                            variant="outline"
                            autoWidth={false}
                            onPress={() => {
                                handingToBuilder.current = true;
                                setRerunFrom(backtestData);
                                // Clear the shared results first: a builder that opens while they are still set would
                                // jump straight to a new results screen (see its effect on `backtestData`).
                                setBacktestData(null);
                                // Replaces this screen, so going back never lands on results the builder has cleared.
                                routeReplace(Routes.StrategySelection, { strategyType: StrategyType.Backtest });
                            }}
                        />
                        <ThemedText type="muted" style={styles.rerunNote}>
                            Opens the builder with these settings. Running it again is a new backtest and costs credits.
                        </ThemedText>
                    </View>
                )}

                {backtestData?.id != null && (
                    <ThemedText type="muted" style={styles.savedNote}>
                        {backtestData.savedAt ? `Saved ${formatDay(backtestData.savedAt.getTime())}` : "Saved to My backtests"}
                    </ThemedText>
                )}

                {backtestData?.dataWindow && <BacktestCoverage window={backtestData.dataWindow} />}

                {backtestData?.plain && <PlainWordsCard numbers={backtestData.plain} />}

                <BacktestResultsTable
                    percentReturn={backtestData?.percentReturn ?? null}
                    percentReturnAdj={backtestData?.percentReturnAdj ?? null}
                    sharpeRatio={backtestData?.sharpeRatio ?? null}
                    sharpeRatioAdj={backtestData?.sharpeRatioAdj ?? null}
                    sortinoRatio={backtestData?.sortinoRatio ?? null}
                    sortinoRatioAdj={backtestData?.sortinoRatioAdj ?? null}
                    periodReturn={backtestData?.periodReturn ?? null}
                    periodReturnAdj={backtestData?.periodReturnAdj ?? null}
                    periodReturnBeforeCosts={backtestData?.periodReturnBeforeCosts ?? null}
                    annualizedIsExtrapolated={backtestData?.annualizedIsExtrapolated ?? false}
                    tradeCostPercent={backtestData?.tradeCostPercent ?? null}
                    tradeCount={backtestData?.tradeCount ?? null}
                    exitSummary={backtestData?.exitSummary ?? null}
                />
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    chartCard: {
        gap: Spacing.sm,
        padding: Spacing.md,
    },

    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    toggleLabel: {
        fontSize: 14,
    },

    savedNote: {
        fontSize: 13,
        textAlign: 'center',
    },

    rerun: {
        gap: Spacing.sm,
    },

    rerunNote: {
        fontSize: 13,
        textAlign: 'center',
    },

})
