import React, { useMemo, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, useTheme } from "@/constants/Theme";
import { ComparePlan, readoutAt } from "../compare";
import {
    Scales, SeriesPoint, formatDay, formatElapsed, formatMonth, formatPercent, formatPercentTick, linePath,
    makeScalesFor, reduceSeries,
} from "./chartMath";

interface CompareChartProps {
    plan: ComparePlan;
    width: number;
    height: number;
}

const PADDING = { left: 46, right: 10, top: 10, bottom: 24 };
export const RUN_B_COLOR = "#f59e0b";

/**
 * Two runs, and the asset when they share one, as percent change since the start. Touch and drag to read all of
 * them on one day (or one day-count, when the runs did not cover the same dates).
 */
export function CompareChart({ plan, width, height }: CompareChartProps) {
    const theme = useTheme();
    const calendar = plan.mode === "calendar";
    const a = useMemo(() => reduceSeries(plan.runA), [plan.runA]);
    const b = useMemo(() => reduceSeries(plan.runB), [plan.runB]);

    const scales: Scales = useMemo(() => {
        let low = Infinity, high = -Infinity, timeStart = Infinity, timeEnd = -Infinity;
        const take = (points: SeriesPoint[], withAsset: boolean) => {
            for (const point of points) {
                low = Math.min(low, point.value, withAsset ? point.price : Infinity);
                high = Math.max(high, point.value, withAsset ? point.price : -Infinity);
            }
            if (points.length) {
                timeStart = Math.min(timeStart, points[0].time);
                timeEnd = Math.max(timeEnd, points[points.length - 1].time);
            }
        };
        take(a, plan.showAsset);
        take(b, false);
        return makeScalesFor({
            timeStart: Number.isFinite(timeStart) ? timeStart : 0, timeEnd: Number.isFinite(timeEnd) ? timeEnd : 1, low, high,
        }, width, height, PADDING);
    }, [a, b, plan.showAsset, width, height]);

    const [activeTime, setActiveTime] = useState<number | null>(null);
    // Rebuilt only when the data or the width changes, never during a gesture.
    const responder = useMemo(() => {
        const scrubTo = (x: number) => {
            const { plot, timeStart, timeEnd } = scales;
            const share = Math.min(1, Math.max(0, (x - plot.left) / (plot.right - plot.left)));
            setActiveTime(timeStart + share * (timeEnd - timeStart));
        };
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false, // keep the finger on the chart, not the page behind it
            onPanResponderGrant: (event) => scrubTo(event.nativeEvent.locationX),
            onPanResponderMove: (event) => scrubTo(event.nativeEvent.locationX),
            onPanResponderRelease: () => setActiveTime(null),
            onPanResponderTerminate: () => setActiveTime(null),
        });
    }, [scales]);

    if (a.length === 0 || b.length === 0) return <ThemedText type="muted">No data to chart</ThemedText>;

    const colorA = theme.primary;
    const colorB = RUN_B_COLOR;
    const colorAsset = theme.mutedText;
    const at = activeTime ?? scales.timeEnd;
    const { a: readA, b: readB, asset: readAsset } = readoutAt(plan, activeTime);
    const whenLabel = (time: number) => (calendar ? formatDay(time) : formatElapsed(time - scales.timeStart));
    const xLabel = (time: number) => (calendar ? formatMonth(time) : formatElapsed(time - scales.timeStart));
    const xLabels = [scales.xTicks[0], (scales.xTicks[0] + scales.xTicks[scales.xTicks.length - 1]) / 2, scales.xTicks[scales.xTicks.length - 1]];
    const show = (value: number | null) => (value === null ? "-" : formatPercent(value));

    return (
        <View>
            <View style={styles.readout}>
                <ThemedText type="muted" style={styles.readoutDate}>
                    {activeTime !== null ? whenLabel(activeTime) : `${whenLabel(scales.timeStart)} to ${whenLabel(scales.timeEnd)}`}
                </ThemedText>
                <View style={styles.readoutValues}>
                    <ReadoutValue color={colorA} label="A" value={show(readA)} />
                    <ReadoutValue color={colorB} label="B" value={show(readB)} />
                    {plan.showAsset && <ReadoutValue color={colorAsset} label="Holding" value={show(readAsset)} />}
                </View>
            </View>

            <View accessible accessibilityRole="image"
                accessibilityLabel={`Two backtests compared. A ${show(readA)}, B ${show(readB)}`}>
                <Svg width={width} height={height}>
                    {scales.yTicks.map((tick) => (
                        <React.Fragment key={`y${tick}`}>
                            <Line
                                x1={scales.plot.left} x2={scales.plot.right} y1={scales.y(tick)} y2={scales.y(tick)}
                                stroke={tick === 0 ? theme.mutedText : theme.border} strokeWidth={1}
                                strokeOpacity={tick === 0 ? 0.55 : 1} strokeDasharray={tick === 0 ? undefined : "3 4"}
                            />
                            <SvgText x={scales.plot.left - 8} y={scales.y(tick) + 3.5} fontSize={11} fill={theme.mutedText} textAnchor="end">
                                {formatPercentTick(tick)}
                            </SvgText>
                        </React.Fragment>
                    ))}
                    {xLabels.map((tick, index) => (
                        <SvgText
                            key={`x${index}`} x={scales.x(tick)} y={height - 6} fontSize={11} fill={theme.mutedText}
                            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
                        >
                            {xLabel(tick)}
                        </SvgText>
                    ))}

                    {plan.showAsset && (
                        <Path d={linePath(a, scales, (p) => p.price)} stroke={colorAsset} strokeWidth={1.5} strokeLinejoin="round" fill="none" />
                    )}
                    <Path d={linePath(b, scales, (p) => p.value)} stroke={colorB} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
                    <Path d={linePath(a, scales, (p) => p.value)} stroke={colorA} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />

                    {activeTime !== null && (
                        <>
                            <Line
                                x1={scales.x(at)} x2={scales.x(at)} y1={scales.plot.top} y2={scales.plot.bottom}
                                stroke={theme.mutedText} strokeWidth={1} strokeOpacity={0.7}
                            />
                            {readAsset !== null && <Circle cx={scales.x(at)} cy={scales.y(readAsset)} r={4} fill={colorAsset} stroke={theme.surface} strokeWidth={2} />}
                            {readB !== null && <Circle cx={scales.x(at)} cy={scales.y(readB)} r={5} fill={colorB} stroke={theme.surface} strokeWidth={2} />}
                            {readA !== null && <Circle cx={scales.x(at)} cy={scales.y(readA)} r={5} fill={colorA} stroke={theme.surface} strokeWidth={2} />}
                        </>
                    )}
                </Svg>
                <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
            </View>
        </View>
    );
}

function ReadoutValue({ color, label, value }: { color: string; label: string; value: string }) {
    return (
        <View style={styles.readoutValue}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <ThemedText type="muted" style={styles.readoutLabel}>{label}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.readoutNumber}>{value}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    readout: {
        gap: Spacing.xs,
        paddingBottom: Spacing.sm,
    },

    readoutDate: {
        fontSize: 13,
    },

    readoutValues: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.lg,
    },

    readoutValue: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },

    swatch: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    readoutLabel: {
        fontSize: 14,
    },

    readoutNumber: {
        fontSize: 16,
    },
});
