import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { EmptyState } from "@/components/EmptyState";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OptionModal } from "@/components/OptionModal";
import { ThemedText } from "@/components/ThemedText";
import { MIN_TOUCH, Spacing, Type, useTheme } from "@/constants/Theme";
import { Routes } from "@/app/Routes";
import { useAuth } from "@/contexts/AuthContext";
import { useBacktest } from "@/contexts/BacktestContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { BacktestHistoryService } from "@/features/strategy/BacktestHistoryService";
import { formatDay, formatPercent } from "@/features/strategy/chart/chartMath";
import { RenameBacktestModal } from "@/features/strategy/components/renameBacktestModal";
import { SavedBacktestItem, appendPage } from "@/features/strategy/SavedBacktest";

export default function MyBacktestsScreen() {
    const { accessToken } = useAuth();
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();
    const { setBacktestData } = useBacktest();
    const theme = useTheme();
    const [items, setItems] = useState<SavedBacktestItem[]>([]);
    const [nextBefore, setNextBefore] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [opening, setOpening] = useState<boolean>(false);
    const [menuFor, setMenuFor] = useState<SavedBacktestItem | null>(null);
    const [renaming, setRenaming] = useState<SavedBacktestItem | null>(null);
    const [savingName, setSavingName] = useState<boolean>(false);

    useEffect(() => {
        if (!accessToken) return; // signed out (this screen can still be in the stack): nothing to load or say
        const loadFirstPage = async () => {
            try {
                const page = await BacktestHistoryService.list(accessToken);
                setItems(page.items);
                setNextBefore(page.nextBefore);
            } catch {
                addToast("Could not load your backtests");
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
            const page = await BacktestHistoryService.list(accessToken, nextBefore);
            setItems((shown) => appendPage(shown, page));
            setNextBefore(page.nextBefore);
        } catch {
            addToast("Could not load more");
        } finally {
            setLoadingMore(false);
        }
    };

    const open = async (item: SavedBacktestItem) => {
        if (!accessToken || opening) return;
        setOpening(true);
        try {
            setBacktestData(await BacktestHistoryService.open(accessToken, item.id));
            routeTo(Routes.BacktestResults);
        } catch (error: any) {
            addToast(error?.status === 404 ? "That backtest is no longer there" : "Could not open that backtest");
            if (error?.status === 404) setItems((shown) => shown.filter((other) => other.id !== item.id));
        } finally {
            setOpening(false);
        }
    };

    const rename = async (label: string) => {
        if (!accessToken || !renaming) return;
        setSavingName(true);
        try {
            const updated = await BacktestHistoryService.rename(accessToken, renaming.id, label);
            setItems((shown) => shown.map((item) => (item.id === updated.id ? updated : item)));
            setRenaming(null);
        } catch {
            addToast("Could not save the name. Please try again");
        } finally {
            setSavingName(false);
        }
    };

    const remove = useCallback(async (item: SavedBacktestItem) => {
        if (!accessToken) return;
        try {
            await BacktestHistoryService.remove(accessToken, item.id);
            setItems((shown) => shown.filter((other) => other.id !== item.id));
        } catch (error: any) {
            if (error?.status === 404) {
                setItems((shown) => shown.filter((other) => other.id !== item.id)); // already gone
            } else {
                addToast("Could not delete it. Please try again");
            }
        }
    }, [accessToken, addToast]);

    const confirmRemove = (item: SavedBacktestItem) => {
        addToast("Delete this saved backtest? This cannot be undone.", [{
            label: "Delete",
            callback: () => remove(item),
        }]);
    };

    return (
        <CustomHeaderView header="My backtests" displayFunds={false}>
            {loading && accessToken ? (
                <LoadingScreen loadingMessage="Loading..." />
            ) : opening ? (
                <LoadingScreen loadingMessage="Opening..." />
            ) : items.length === 0 ? (
                <EmptyState
                    title="No saved backtests yet"
                    message="Every backtest you run is kept here, so you can open it again for free."
                />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <ThemedText type="muted" style={styles.hint}>
                        Opening a saved backtest is free. Your newest 50 are kept.
                    </ThemedText>
                    {items.map((item) => (
                        <TouchableOpacity key={item.id} onPress={() => open(item)} activeOpacity={0.7}
                            accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
                            <Card style={styles.row}>
                                <View style={styles.rowText}>
                                    <ThemedText style={styles.title} numberOfLines={1}>{item.title}</ThemedText>
                                    <ThemedText type="muted" style={styles.small}>
                                        {`${formatDay(item.coveredStart.getTime())} to ${formatDay(item.coveredEnd.getTime())}`}
                                    </ThemedText>
                                    <View style={styles.meta}>
                                        {item.periodReturn !== null && (
                                            <Badge
                                                label={formatPercent(item.periodReturn)}
                                                tone={item.periodReturn >= 0 ? "gain" : "loss"}
                                            />
                                        )}
                                        <ThemedText type="muted" style={styles.small}>
                                            {[
                                                item.label.trim() !== "" ? `${item.symbol} · ${item.interval}` : null,
                                                item.trades !== null ? `${item.trades} ${item.trades === 1 ? "trade" : "trades"}` : null,
                                                item.hasExitRules ? "exit rules" : null,
                                            ].filter(Boolean).join(" · ")}
                                        </ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.menuButton}
                                    onPress={() => setMenuFor(item)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Options for ${item.title}`}
                                >
                                    <Ionicons name="ellipsis-horizontal" size={22} color={theme.icon} />
                                </TouchableOpacity>
                            </Card>
                        </TouchableOpacity>
                    ))}
                    {nextBefore !== null && (
                        <GeneralButton title="Load more" variant="outline" onPress={loadMore} loading={loadingMore} autoWidth={false} />
                    )}
                </ScrollView>
            )}

            <OptionModal
                visible={menuFor !== null}
                title={menuFor?.title}
                options={[{ key: "rename", label: "Rename" }, { key: "delete", label: "Delete" }]}
                onSelect={(key) => {
                    const item = menuFor;
                    if (!item) return;
                    if (key === "rename") setRenaming(item);
                    else confirmRemove(item);
                }}
                onClose={() => setMenuFor(null)}
            />
            <RenameBacktestModal
                visible={renaming !== null}
                initialLabel={renaming?.label ?? ""}
                saving={savingName}
                onSave={rename}
                onClose={() => setRenaming(null)}
            />
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },

    hint: {
        fontSize: 13,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },

    rowText: {
        flex: 1,
        gap: Spacing.xs,
    },

    title: {
        ...Type.bodyStrong,
    },

    small: {
        fontSize: 13,
        flexShrink: 1,
    },

    meta: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },

    menuButton: {
        minWidth: MIN_TOUCH,
        minHeight: MIN_TOUCH,
        alignItems: "center",
        justifyContent: "center",
    },
});
