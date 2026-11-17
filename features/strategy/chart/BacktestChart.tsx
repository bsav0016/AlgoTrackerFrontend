import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, useTheme } from "@/constants/Theme";
import { Trade } from "../classes/Trade";
import {
    Marker, SeriesPoint, formatMonth, formatTick, linePath, makeScales, reduceSeries, tradeMarkers,
} from "./chartMath";

interface BacktestChartProps {
    points: SeriesPoint[];
    trades: Trade[];
    showSignals: boolean;
    width: number;
    height: number;
}

const PADDING = { left: 44, right: 8, top: 8, bottom: 22 };
const STRATEGY_COLOR = "#f59e0b";
const EXIT_COLOR = "#a855f7";

/** The asset price and the strategy's value over the backtest, with a marker for each trade, drawn on the device. */
export function BacktestChart({ points, trades, showSignals, width, height }: BacktestChartProps) {
    const theme = useTheme();
    const drawn = useMemo(() => reduceSeries(points), [points]);
    const scales = useMemo(() => makeScales(drawn, width, height, PADDING), [drawn, width, height]);
    const markers = useMemo(() => tradeMarkers(trades, scales.timeStart, scales.timeEnd), [trades, scales]);

    const colorOf = (marker: Marker) =>
        marker.kind === "buy" ? theme.gain : marker.kind === "exit" ? EXIT_COLOR : theme.loss;

    const summary = drawn.length
        ? `Chart of the asset price and the strategy's value from ${formatMonth(scales.timeStart)} to ${formatMonth(scales.timeEnd)}`
        : "No data to chart";

    return (
        <View accessible accessibilityRole="image" accessibilityLabel={summary}>
            <Svg width={width} height={height}>
                {scales.yTicks.map((tick) => (
                    <React.Fragment key={`y${tick}`}>
                        <Line
                            x1={scales.plot.left} x2={scales.plot.right} y1={scales.y(tick)} y2={scales.y(tick)}
                            stroke={theme.border} strokeWidth={1} strokeDasharray="3 3"
                        />
                        <SvgText x={scales.plot.left - 6} y={scales.y(tick) + 3} fontSize={10} fill={theme.mutedText} textAnchor="end">
                            {formatTick(tick)}
                        </SvgText>
                    </React.Fragment>
                ))}
                {scales.xTicks.map((tick, index) => (
                    <SvgText
                        key={`x${index}`} x={scales.x(tick)} y={height - 6} fontSize={10} fill={theme.mutedText}
                        textAnchor={index === 0 ? "start" : index === scales.xTicks.length - 1 ? "end" : "middle"}
                    >
                        {formatMonth(tick)}
                    </SvgText>
                ))}

                {showSignals && markers.map((marker, index) => (
                    <Line
                        key={`m${index}`} x1={scales.x(marker.time)} x2={scales.x(marker.time)}
                        y1={scales.plot.top} y2={scales.plot.bottom}
                        stroke={colorOf(marker)} strokeWidth={1} strokeOpacity={0.55}
                    />
                ))}

                <Path d={linePath(drawn, scales, (p) => p.price)} stroke={theme.primary} strokeWidth={1.5} fill="none" />
                <Path d={linePath(drawn, scales, (p) => p.value)} stroke={STRATEGY_COLOR} strokeWidth={1.5} fill="none" />
            </Svg>
        </View>
    );
}

/** What each colour means. It sits under the chart, outside the zoomable area, so it neither zooms nor clips. */
export function ChartLegend({ trades, showSignals }: { trades: Trade[]; showSignals: boolean }) {
    const theme = useTheme();
    const kinds = new Set(tradeMarkers(trades, -Infinity, Infinity).map((marker) => marker.kind));
    return (
        <View style={styles.legend}>
            <LegendItem color={theme.primary} label="Asset price" />
            <LegendItem color={STRATEGY_COLOR} label="Strategy value" />
            {showSignals && kinds.has("buy") && <LegendItem color={theme.gain} label="Buy" />}
            {showSignals && kinds.has("sell") && <LegendItem color={theme.loss} label="Sell" />}
            {showSignals && kinds.has("exit") && <LegendItem color={EXIT_COLOR} label="Exit rule" />}
        </View>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <ThemedText type="muted" style={styles.legendText}>{label}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    legend: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
        paddingTop: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },

    swatch: {
        width: 12,
        height: 3,
        borderRadius: 2,
    },

    legendText: {
        fontSize: 12,
    },
});
