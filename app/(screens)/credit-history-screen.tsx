import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { EmptyState } from "@/components/EmptyState";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CreditEntry, appendPage, bucketName, formatCreditAmount } from "@/features/credits/CreditEntry";
import { CreditService } from "@/features/credits/CreditService";

export default function CreditHistoryScreen() {
    const { accessToken } = useAuth();
    const { addToast } = useToast();
    const theme = useTheme();
    const [entries, setEntries] = useState<CreditEntry[]>([]);
    const [nextBefore, setNextBefore] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    useEffect(() => {
        if (!accessToken) {
            addToast("Please log back in to see your credit history");
            return;
        }
        const loadFirstPage = async () => {
            try {
                const page = await CreditService.fetchHistory(accessToken);
                setEntries(page.entries);
                setNextBefore(page.nextBefore);
            } catch {
                addToast("Could not load your credit history");
            } finally {
                setLoading(false);
            }
        };
        loadFirstPage();
    }, [accessToken, addToast]);

    const loadMore = async () => {
        if (!accessToken || nextBefore === null) return;
        setLoadingMore(true);
        try {
            const page = await CreditService.fetchHistory(accessToken, nextBefore);
            setEntries((shown) => appendPage(shown, page));
            setNextBefore(page.nextBefore);
        } catch {
            addToast("Could not load more");
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <CustomHeaderView header="Credit history" displayFunds={false}>
            {loading && accessToken ? (
                <LoadingScreen loadingMessage="Loading..." />
            ) : entries.length === 0 ? (
                <EmptyState title="No credit activity yet" message="Purchases, backtests and subscriptions will show up here." />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {entries.map((entry) => (
                        <Card key={entry.id} style={styles.row}>
                            <View style={styles.rowTop}>
                                <ThemedText style={styles.label} numberOfLines={2}>{entry.label}</ThemedText>
                                <ThemedText
                                    style={[styles.amount, { color: entry.amount < 0 ? theme.loss : theme.gain }]}
                                >
                                    {formatCreditAmount(entry.amount)}
                                </ThemedText>
                            </View>
                            <View style={styles.rowBottom}>
                                <ThemedText type="muted" style={styles.small}>
                                    {entry.createdAt.toLocaleDateString()}
                                </ThemedText>
                                <Badge label={bucketName(entry.bucket)} />
                                <ThemedText type="muted" style={[styles.small, styles.balance]}>
                                    {`Balance ${entry.balanceAfter.toLocaleString("en-US")}`}
                                </ThemedText>
                            </View>
                        </Card>
                    ))}
                    {nextBefore !== null && (
                        <GeneralButton
                            title="Load more"
                            variant="outline"
                            onPress={loadMore}
                            loading={loadingMore}
                            autoWidth={false}
                        />
                    )}
                </ScrollView>
            )}
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    row: {
        gap: Spacing.sm,
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: Spacing.md,
    },
    rowBottom: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    label: {
        flex: 1,
        ...Type.bodyStrong,
    },
    amount: {
        ...Type.bodyStrong,
    },
    small: {
        fontSize: 13,
    },
    balance: {
        marginLeft: "auto",
    },
});
