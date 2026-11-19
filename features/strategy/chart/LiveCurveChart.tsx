import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, useTheme } from "@/constants/Theme";
import { Trade } from "../classes/Trade";
import { EquityPoint, curveGlyphs, curveReadout, curveSeries } from "../liveCurve";
import {
    MarkerKind, formatDay, formatMonth, formatPercent, formatPercentTick, glyphPath, linePath, makeScalesFor,
} from "./chartMath";
import { createScrubResponder } from "./scrubResponder";

interface LiveCurveChartProps {
    curve: EquityPoint[];
    trades: Trade[];
    width: number;
    height: number;
}

const PADDING = { left: 46, right: 10, top: 10, bottom: 24 };
const EXIT_COLOR = "#a855f7";
const NAMES: Record<MarkerKind, string> = { buy: "Buy", sell: "Sell", exit: "Exit rule" };

/**
 * A tracked strategy's value over time as percent change since its first buy, drawn on the device. The value only
 * changes when a trade closes, so the line holds flat and steps. Touch and drag to read any day.
 */
export function LiveCurveChart({ curve, trades, width, height }: LiveCurveChartProps) {
    const theme = useTheme();
    const series = useMemo(() => curveSeries(curve), [curve]);
    const scales = useMemo(() => {
        const values = series.map((point) => point.value);
        return makeScalesFor({
            timeStart: series.length ? series[0].time : 0,
            timeEnd: series.length ? series[series.length - 1].time : 1,
            low: Math.min(0, ...values),
            high: Math.max(0, ...values),
        }, width, height, PADDING);
    }, [series, width, height]);
    const glyphs = useMemo(() => curveGlyphs(trades, series, scales), [trades, series, scales]);
    const kinds = useMemo(() => new Set(glyphs.map((glyph) => glyph.kind)), [glyphs]);
    const [touched, setTouched] = useState<number | null>(null);

    // Rebuilt only when the data or the width changes, never during a gesture.
    const responder = useMemo(() => {
        const scrubTo = (x: number) => {
            const { plot, timeStart, timeEnd } = scales;
            const share = Math.min(1, Math.max(0, (x - plot.left) / (plot.right - plot.left)));
            setTouched(timeStart + share * (timeEnd - timeStart));
        };
        return createScrubResponder({ scrubTo, end: () => setTouched(null) });
    }, [scales]);

    const readout = curveReadout(series, touched);
    if (series.length === 0 || readout === null) return null;

    const color = theme.primary;
    const colorOf = (kind: MarkerKind) => (kind === "buy" ? theme.gain : kind === "exit" ? EXIT_COLOR : theme.loss);
    const line = linePath(series, scales, (point) => point.value);
    const first = series[0], last = series[series.length - 1];
    const area = `${line} L${scales.x(last.time).toFixed(1)} ${scales.y(0).toFixed(1)} L${scales.x(first.time).toFixed(1)} ${scales.y(0).toFixed(1)} Z`;
    const xLabels = [scales.xTicks[0], (scales.xTicks[0] + scales.xTicks[scales.xTicks.length - 1]) / 2, scales.xTicks[scales.xTicks.length - 1]];

    return (
        <View>
            <View style={styles.readout}>
                <ThemedText type="muted" style={styles.readoutDate}>
                    {touched !== null ? formatDay(readout.time) : `${formatDay(first.time)} to ${formatDay(last.time)}`}
                </ThemedText>
                <View style={styles.readoutRow}>
                    <View style={[styles.swatch, { backgroundColor: color }]} />
                    <ThemedText type="muted" style={styles.readoutLabel}>Strategy</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.readoutNumber}>{formatPercent(readout.percent)}</ThemedText>
                </View>
            </View>

            <View accessible accessibilityRole="image"
                accessibilityLabel={`The strategy is ${formatPercent(last.value)} since its first buy, from ${formatDay(first.time)} to ${formatDay(last.time)}`}>
                <Svg width={width} height={height}>
                    <Defs>
                        <LinearGradient id="liveFill" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                            <Stop offset="1" stopColor={color} stopOpacity={0} />
                        </LinearGradient>
                    </Defs>

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
                            {formatMonth(tick)}
                        </SvgText>
                    ))}

                    <Path d={area} fill="url(#liveFill)" />
                    <Path d={line} stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />

                    {glyphs.map((glyph, index) => (
                        <Path
                            key={`g${index}`} d={glyphPath(glyph.kind, glyph.x, glyph.y)} fill={colorOf(glyph.kind)}
                            stroke={theme.surface} strokeWidth={1} strokeLinejoin="round"
                        />
                    ))}

                    {touched !== null && (
                        <>
                            <Line
                                x1={scales.x(readout.time)} x2={scales.x(readout.time)} y1={scales.plot.top} y2={scales.plot.bottom}
                                stroke={theme.mutedText} strokeWidth={1} strokeOpacity={0.7}
                            />
                            <Circle cx={scales.x(readout.time)} cy={scales.y(readout.percent)} r={5} fill={color} stroke={theme.surface} strokeWidth={2} />
                        </>
                    )}
                </Svg>
                <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
            </View>

            {kinds.size > 0 && (
                <View style={styles.marks}>
                    {(["buy", "sell", "exit"] as MarkerKind[]).filter((kind) => kinds.has(kind)).map((kind) => (
                        <View key={kind} style={styles.mark}>
                            <Svg width={14} height={14}>
                                <Path d={glyphPath(kind, 7, 7)} fill={colorOf(kind)} />
                            </Svg>
                            <ThemedText type="muted" style={styles.markText}>{NAMES[kind]}</ThemedText>
                        </View>
                    ))}
                </View>
            )}
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

    readoutRow: {
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

    marks: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.lg,
        paddingTop: Spacing.sm,
    },

    mark: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },

    markText: {
        fontSize: 12,
    },
});
