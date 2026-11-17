import React, { useMemo, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, useTheme } from "@/constants/Theme";
import { Trade } from "../classes/Trade";
import {
    MarkerKind, SeriesPoint, formatDay, formatMonth, formatPercent, formatPercentTick, glyphPath, linePath, makeScales,
    nearestIndex, percentSeries, reduceSeries, tradeGlyphs, tradeMarkers,
} from "./chartMath";

interface BacktestChartProps {
    points: SeriesPoint[];
    trades: Trade[];
    showSignals: boolean;
    width: number;
    height: number;
}

const PADDING = { left: 46, right: 10, top: 10, bottom: 24 };
const EXIT_COLOR = "#a855f7";
const GLYPH_NAMES: Record<MarkerKind, string> = { buy: "Buy", sell: "Sell", exit: "Exit rule" };

/**
 * The strategy and the asset as percent change since the start, drawn on the device. The strategy is the bold line
 * with a soft fill under it; each trade is a small mark on it. Touch and drag to read the values on any day.
 */
export function BacktestChart({ points, trades, showSignals, width, height }: BacktestChartProps) {
    const theme = useTheme();
    const percent = useMemo(() => percentSeries(points), [points]);
    const drawn = useMemo(() => reduceSeries(percent), [percent]);
    const scales = useMemo(() => makeScales(drawn, width, height, PADDING), [drawn, width, height]);
    const glyphs = useMemo(() => tradeGlyphs(trades, drawn, scales), [trades, drawn, scales]);
    const kinds = useMemo(() => new Set(tradeMarkers(trades, scales.timeStart, scales.timeEnd).map((m) => m.kind)), [trades, scales]);
    const [active, setActive] = useState<number | null>(null);

    // Rebuilt only when the data or the width changes, never during a gesture.
    const responder = useMemo(() => {
        const scrubTo = (x: number) => {
            const { left, right } = scales.plot;
            const share = Math.min(1, Math.max(0, (x - left) / (right - left)));
            const index = nearestIndex(drawn, scales.timeStart + share * (scales.timeEnd - scales.timeStart));
            setActive(index >= 0 ? index : null);
        };
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false, // keep the finger on the chart, not the page behind it
            onPanResponderGrant: (event) => scrubTo(event.nativeEvent.locationX),
            onPanResponderMove: (event) => scrubTo(event.nativeEvent.locationX),
            onPanResponderRelease: () => setActive(null),
            onPanResponderTerminate: () => setActive(null),
        });
    }, [drawn, scales]);

    if (drawn.length === 0) return <ThemedText type="muted">No data to chart</ThemedText>;

    const shown = active !== null && drawn[active] ? drawn[active] : drawn[drawn.length - 1];
    const strategyColor = theme.primary;
    const assetColor = theme.mutedText;
    const colorOf = (kind: MarkerKind) => (kind === "buy" ? theme.gain : kind === "exit" ? EXIT_COLOR : theme.loss);
    const strategyLine = linePath(drawn, scales, (p) => p.value);
    const first = drawn[0], last = drawn[drawn.length - 1];
    const area = `${strategyLine} L${scales.x(last.time).toFixed(1)} ${scales.plot.bottom} L${scales.x(first.time).toFixed(1)} ${scales.plot.bottom} Z`;
    const xLabels = [scales.xTicks[0], (scales.xTicks[0] + scales.xTicks[scales.xTicks.length - 1]) / 2, scales.xTicks[scales.xTicks.length - 1]];

    const summary = `Strategy ${formatPercent(last.value)} against the asset ${formatPercent(last.price)}, from ${formatDay(scales.timeStart)} to ${formatDay(scales.timeEnd)}`;

    return (
        <View>
            <View style={styles.readout}>
                <ThemedText type="muted" style={styles.readoutDate}>
                    {active !== null ? formatDay(shown.time) : `${formatDay(scales.timeStart)} to ${formatDay(scales.timeEnd)}`}
                </ThemedText>
                <View style={styles.readoutValues}>
                    <ReadoutValue color={strategyColor} label="Strategy" value={formatPercent(shown.value)} />
                    <ReadoutValue color={assetColor} label="Holding" value={formatPercent(shown.price)} />
                </View>
            </View>

            <View accessible accessibilityRole="image" accessibilityLabel={summary}>
                <Svg width={width} height={height}>
                    <Defs>
                        <LinearGradient id="strategyFill" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={strategyColor} stopOpacity={0.28} />
                            <Stop offset="1" stopColor={strategyColor} stopOpacity={0} />
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

                    <Path d={area} fill="url(#strategyFill)" />
                    <Path d={linePath(drawn, scales, (p) => p.price)} stroke={assetColor} strokeWidth={1.5} strokeLinejoin="round" fill="none" />
                    <Path d={strategyLine} stroke={strategyColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />

                    {showSignals && glyphs.map((glyph, index) => (
                        <Path
                            key={`g${index}`} d={glyphPath(glyph.kind, glyph.x, glyph.y)} fill={colorOf(glyph.kind)}
                            stroke={theme.surface} strokeWidth={1} strokeLinejoin="round"
                        />
                    ))}

                    {active !== null && (
                        <>
                            <Line
                                x1={scales.x(shown.time)} x2={scales.x(shown.time)} y1={scales.plot.top} y2={scales.plot.bottom}
                                stroke={theme.mutedText} strokeWidth={1} strokeOpacity={0.7}
                            />
                            <Circle cx={scales.x(shown.time)} cy={scales.y(shown.price)} r={4} fill={assetColor} stroke={theme.surface} strokeWidth={2} />
                            <Circle cx={scales.x(shown.time)} cy={scales.y(shown.value)} r={5} fill={strategyColor} stroke={theme.surface} strokeWidth={2} />
                        </>
                    )}
                </Svg>
                <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
            </View>

            {showSignals && kinds.size > 0 && (
                <View style={styles.marks}>
                    {(["buy", "sell", "exit"] as MarkerKind[]).filter((kind) => kinds.has(kind)).map((kind) => (
                        <View key={kind} style={styles.mark}>
                            <Svg width={14} height={14}>
                                <Path d={glyphPath(kind, 7, 7)} fill={colorOf(kind)} />
                            </Svg>
                            <ThemedText type="muted" style={styles.markText}>{GLYPH_NAMES[kind]}</ThemedText>
                        </View>
                    ))}
                </View>
            )}
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
