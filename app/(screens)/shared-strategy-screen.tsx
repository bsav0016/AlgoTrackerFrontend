import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import { Routes } from "@/app/Routes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { SHARE_DISCLAIMER, isShareId } from "@/features/sharing/ShareLink";
import { ShareService } from "@/features/sharing/ShareService";
import { SharedStrategy, describeSignal } from "@/features/sharing/SharedStrategy";
import { NetworkError } from "@/lib/networkRequests/NetworkError";

export default function SharedStrategyScreen() {
    const { shareId } = useLocalSearchParams<{ shareId?: string }>();
    const { accessToken } = useAuth();
    const { updateUserData } = useUser();
    const { routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const theme = useTheme();

    const [shared, setShared] = useState<SharedStrategy | null>(null);
    const [problem, setProblem] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [adding, setAdding] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!isShareId(shareId)) {
                setProblem("This link does not look right.");
                setLoading(false);
                return;
            }
            try {
                const result = await ShareService.getShared(shareId);
                if (!cancelled) setShared(result);
            } catch (error) {
                if (cancelled) return;
                if (error instanceof NetworkError && error.status === 404) {
                    setProblem("This strategy is not shared any more.");
                } else if (error instanceof NetworkError && error.status === 429) {
                    setProblem("Too many tries. Please wait a minute and open the link again.");
                } else {
                    setProblem("Could not open this strategy. Please try again later.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [shareId]);

    const addToMyStrategies = async () => {
        if (!accessToken || !isShareId(shareId)) {
            addToast("Please sign in first");
            return;
        }
        setAdding(true);
        try {
            await ShareService.cloneShared(shareId, accessToken);
            await updateUserData(accessToken);
            addToast("Added as a draft. Open it to start tracking.");
            routeReplace(Routes.Home);
        } catch (error) {
            if (error instanceof NetworkError && error.status === 404) {
                addToast("This strategy is not shared any more");
            } else {
                addToast("Could not add the strategy. Please try again");
            }
        } finally {
            setAdding(false);
        }
    };

    const formatPercent = (value: number): string => {
        const percent = (value - 1) * 100;
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };
    const returnColor = (value: number): string => (value >= 1 ? theme.gain : theme.loss);

    if (loading) {
        return <LoadingScreen loadingMessage="Opening shared strategy" />;
    }

    return (
        <CustomHeaderView header="Shared with you">
            <ScrollView contentContainerStyle={styles.content}>
                {shared ? (
                    <>
                        <Card style={styles.card}>
                            <ThemedText style={styles.title}>{shared.title}</ThemedText>
                            <ThemedText type="muted">{`${shared.symbol} · ${shared.interval}`}</ThemedText>

                            <View style={styles.metrics}>
                                <View style={styles.metric}>
                                    <ThemedText type="muted" style={styles.metricLabel}>Strategy return</ThemedText>
                                    <ThemedText style={[styles.metricValue, { color: returnColor(shared.strategyReturn) }]}>
                                        {formatPercent(shared.strategyReturn)}
                                    </ThemedText>
                                </View>
                                <View style={styles.metric}>
                                    <ThemedText type="muted" style={styles.metricLabel}>Asset return</ThemedText>
                                    <ThemedText style={[styles.metricValue, { color: returnColor(shared.assetReturn) }]}>
                                        {formatPercent(shared.assetReturn)}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>

                        <ThemedText style={styles.sectionTitle}>Buy when</ThemedText>
                        <Card>
                            {shared.buySignals.map((signal, index) => (
                                <ThemedText key={index}>{describeSignal(signal)}</ThemedText>
                            ))}
                        </Card>

                        {shared.sellSignals.length > 0 && (
                            <>
                                <ThemedText style={styles.sectionTitle}>Sell when</ThemedText>
                                <Card>
                                    {shared.sellSignals.map((signal, index) => (
                                        <ThemedText key={index}>{describeSignal(signal)}</ThemedText>
                                    ))}
                                </Card>
                            </>
                        )}

                        <ThemedText type="muted" style={styles.disclaimer}>{SHARE_DISCLAIMER}</ThemedText>

                        <ThemedText type="muted" style={styles.disclaimer}>
                            Adding it copies these rules into your account as a draft. It is free, and nothing is tracked or
                            charged until you start it.
                        </ThemedText>
                        <GeneralButton
                            title="Add to my strategies"
                            onPress={addToMyStrategies}
                            loading={adding}
                            disabled={adding}
                            autoWidth={false}
                        />
                    </>
                ) : (
                    <EmptyState title="Can't open this strategy" message={problem ?? "Please try again later."} />
                )}
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        gap: Spacing.md,
    },
    title: {
        ...Type.title,
    },
    metrics: {
        flexDirection: "row",
        gap: Spacing.lg,
    },
    metric: {
        flex: 1,
        gap: Spacing.xs,
    },
    metricLabel: {
        ...Type.caption,
        fontWeight: "600",
    },
    metricValue: {
        ...Type.title,
    },
    sectionTitle: {
        ...Type.subtitle,
        marginTop: Spacing.sm,
    },
    disclaimer: {
        ...Type.caption,
    },
});
