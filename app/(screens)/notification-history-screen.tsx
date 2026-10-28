import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { EmptyState } from "@/components/EmptyState";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type } from "@/constants/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { NotificationEntry, appendPage } from "@/features/notifications/NotificationEntry";
import { NotificationService } from "@/features/notifications/NotificationService";
import { useOpenStrategy } from "@/features/notifications/useOpenStrategy";

export default function NotificationHistoryScreen() {
    const { accessToken } = useAuth();
    const { addToast } = useToast();
    const openStrategy = useOpenStrategy();
    const [entries, setEntries] = useState<NotificationEntry[]>([]);
    const [nextBefore, setNextBefore] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    useEffect(() => {
        if (!accessToken) {
            addToast("Please log back in to see your notifications");
            return;
        }
        const loadFirstPage = async () => {
            try {
                const page = await NotificationService.fetchHistory(accessToken);
                setEntries(page.entries);
                setNextBefore(page.nextBefore);
            } catch {
                addToast("Could not load your notifications");
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
            const page = await NotificationService.fetchHistory(accessToken, nextBefore);
            setEntries((shown) => appendPage(shown, page));
            setNextBefore(page.nextBefore);
        } catch {
            addToast("Could not load more");
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <CustomHeaderView header="Signal notifications" displayFunds={false}>
            {loading && accessToken ? (
                <LoadingScreen loadingMessage="Loading..." />
            ) : entries.length === 0 ? (
                <EmptyState title="No signals yet" message="When a strategy you follow signals a buy or sell, it will be listed here." />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {entries.map((entry) => (
                        <TouchableOpacity key={entry.id} onPress={() => openStrategy(entry.strategyId)} activeOpacity={0.7}>
                            <Card style={styles.row}>
                                <ThemedText style={styles.message} numberOfLines={2}>{entry.message}</ThemedText>
                                <View style={styles.rowBottom}>
                                    <Badge
                                        label={entry.kind === "buy" ? "Buy" : "Sell"}
                                        tone={entry.kind === "buy" ? "gain" : "loss"}
                                    />
                                    <ThemedText type="muted" style={styles.small}>
                                        {`${entry.createdAt.toLocaleDateString()} ${entry.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                                    </ThemedText>
                                    <ThemedText type="muted" style={[styles.small, styles.price]}>
                                        {`at ${entry.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </ThemedText>
                                </View>
                            </Card>
                        </TouchableOpacity>
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
    rowBottom: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    message: {
        ...Type.bodyStrong,
    },
    small: {
        fontSize: 13,
    },
    price: {
        marginLeft: "auto",
    },
});
