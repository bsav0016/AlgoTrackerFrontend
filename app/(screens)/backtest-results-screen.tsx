import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Switch, StyleSheet, ScrollView, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
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
import { BacktestChart } from "@/features/strategy/chart/BacktestChart";


// Card padding (Spacing.lg + Spacing.md on each side) plus the card border; the chart is about 2:1.
const CHART_WIDTH = Dimensions.get("window").width - 2 * (Spacing.lg + Spacing.md) - 2;
const CHART_HEIGHT = Math.round(CHART_WIDTH * 0.62);

export default function BacktestResults() {
    const { backtestData } = useBacktest(); 
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();
    const theme = useTheme();
    const [displaySignals, setDisplaySignals] = useState(true);

    const points = useMemo(() => backtestData?.chartPoints() ?? [], [backtestData]);

    useEffect(() => {
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

                {backtestData?.dataWindow && <BacktestCoverage window={backtestData.dataWindow} />}

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

})
