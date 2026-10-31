import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextField } from "@/components/TextField";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import {
    Board, BoardGroup, BoardKind, GROUP_LABELS, NAME_MAX, RULES_TEXT,
    formatEdge, formatWeek, nameProblem, neighbourWeek, serverNameProblem,
} from "@/features/leaderboard/Leaderboard";
import { LeaderboardService } from "@/features/leaderboard/LeaderboardService";
import { NetworkError } from "@/lib/networkRequests/NetworkError";

export default function LeaderboardScreen() {
    const { accessToken } = useAuth();
    const { user, updateUserData } = useUser();
    const { addToast } = useToast();
    const theme = useTheme();

    const [kind, setKind] = useState<BoardKind>("all_time");
    const [group, setGroup] = useState<BoardGroup>("daily_or_longer");
    const [week, setWeek] = useState<string | null>(null);
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [failed, setFailed] = useState<boolean>(false);
    const [name, setName] = useState<string>(user?.leaderboardName ?? "");
    const [nameError, setNameError] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState<boolean>(false);
    const [reload, setReload] = useState<number>(0);

    // Every setState happens in an event handler or after the request returns, and a response that arrives after
    // the user has already picked something else is dropped.
    useEffect(() => {
        if (!accessToken) return;
        let cancelled = false;
        LeaderboardService.getBoard({ kind, group, week }, accessToken)
            .then((result) => {
                if (cancelled) return;
                setBoard(result);
                setFailed(false);
                setLoading(false);
            })
            .catch((error) => {
                if (cancelled) return;
                setBoard(null);
                setFailed(true);
                setLoading(false);
                if (error instanceof NetworkError && error.status === 429) {
                    addToast("Too many requests. Please wait a minute");
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- addToast is stable enough; reload only when what is shown changes
    }, [accessToken, kind, group, week, reload]);

    const refresh = () => {
        setLoading(true);
        setReload((n) => n + 1);
    };

    const changeKind = (next: BoardKind) => {
        setLoading(true);
        setWeek(null); // a new tab starts at the latest week
        setKind(next);
    };

    const changeGroup = (next: BoardGroup) => {
        setLoading(true);
        setGroup(next);
    };

    const changeWeek = (next: string | null) => {
        setLoading(true);
        setWeek(next);
    };

    const joinOrRename = async () => {
        const problem = nameProblem(name);
        if (problem) {
            setNameError(problem);
            return;
        }
        if (!accessToken) return;
        setSaving(true);
        setNameError(undefined);
        try {
            const saved = await LeaderboardService.join(name, accessToken);
            setName(saved);
            await updateUserData(accessToken);
            addToast(user?.leaderboardName ? "Name changed" : "You are on the leaderboard");
            refresh();
        } catch (error) {
            const reason = error instanceof NetworkError ? serverNameProblem(error.details) : null;
            if (reason) {
                setNameError(reason);
            } else if (error instanceof NetworkError && error.status === 429) {
                setNameError("Too many name changes. Please try again later");
            } else {
                addToast("Could not save the name. Please try again");
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmLeave = () => {
        addToast("Leave the leaderboard? Your name and your past entries are deleted.", [{
            label: "Leave",
            callback: () => leave(),
        }]);
    };

    const leave = async () => {
        if (!accessToken) return;
        try {
            await LeaderboardService.leave(accessToken);
            setName("");
            await updateUserData(accessToken);
            addToast("You have left the leaderboard");
            refresh();
        } catch {
            addToast("Could not leave the leaderboard. Please try again");
        }
    };

    const onBoard = user?.leaderboardName != null;
    const older = board ? neighbourWeek(board.weeks, board.periodStart, "older") : null;
    const newer = board ? neighbourWeek(board.weeks, board.periodStart, "newer") : null;

    const edgeColor = (score: number): string => (score >= 1 ? theme.gain : theme.loss);

    return (
        <CustomHeaderView header="Leaderboard">
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <SegmentedControl
                    options={[{ value: "all_time", label: "All time" }, { value: "week", label: "Last week" }]}
                    value={kind}
                    onChange={changeKind}
                />
                <SegmentedControl
                    options={(Object.keys(GROUP_LABELS) as BoardGroup[]).map((value) => ({ value, label: GROUP_LABELS[value] }))}
                    value={group}
                    onChange={changeGroup}
                />

                {kind === "week" && board?.periodStart && (
                    <View style={styles.weekRow}>
                        <GeneralButton title="‹ Older" variant="ghost" disabled={!older} onPress={() => changeWeek(older)} />
                        <ThemedText type="defaultSemiBold">{formatWeek(board.periodStart)}</ThemedText>
                        <GeneralButton title="Newer ›" variant="ghost" disabled={!newer} onPress={() => changeWeek(newer)} />
                    </View>
                )}

                <Card style={styles.profileCard}>
                    <ThemedText type="defaultSemiBold">
                        {onBoard ? `You appear as ${user?.leaderboardName}` : "Join the leaderboard"}
                    </ThemedText>
                    <ThemedText type="muted" style={styles.caption}>
                        {onBoard
                            ? "Your board name, rank and results are visible to other users. Your rules and your real name are not."
                            : "Pick a board name to appear. It is shown with your rank and results to other users, never your real name or your rules. You can leave at any time and your entries are deleted."}
                    </ThemedText>
                    <TextField
                        label="Board name"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            setNameError(undefined);
                        }}
                        maxLength={NAME_MAX + 10}
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={nameError}
                        placeholder="3 to 20 letters, numbers, spaces"
                    />
                    <GeneralButton
                        title={onBoard ? "Change name" : "Join"}
                        onPress={joinOrRename}
                        loading={saving}
                        disabled={saving || name.trim() === (user?.leaderboardName ?? "")}
                        autoWidth={false}
                    />
                    {onBoard && <GeneralButton title="Leave leaderboard" variant="ghost" onPress={confirmLeave} autoWidth={false} />}
                </Card>

                {board?.me && (
                    <Card style={styles.mePlace}>
                        <ThemedText type="muted" style={styles.caption}>Your place</ThemedText>
                        <View style={styles.row}>
                            <ThemedText style={styles.rank}>{`#${board.me.rank}`}</ThemedText>
                            <ThemedText style={[styles.edge, { color: edgeColor(board.me.score) }]}>
                                {`${formatEdge(board.me.score)} vs holding`}
                            </ThemedText>
                        </View>
                    </Card>
                )}
                {board && board.onBoard && !board.me && (
                    <ThemedText type="muted" style={styles.caption}>
                        You are not ranked here yet. A strategy needs 14 days live and 3 completed trades.
                    </ThemedText>
                )}

                {loading ? (
                    <LoadingScreen loadingMessage="Loading the leaderboard" />
                ) : failed ? (
                    <EmptyState title="Can't load the leaderboard" message="Check your connection and try again.">
                        <GeneralButton title="Try again" onPress={refresh} />
                    </EmptyState>
                ) : board && board.entries.length > 0 ? (
                    <Card style={styles.list}>
                        {board.entries.map((entry, index) => (
                            <View
                                key={`${entry.rank}-${entry.displayName}`}
                                style={[
                                    styles.row,
                                    index < board.entries.length - 1 && { borderColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                                    entry.isMe && { backgroundColor: theme.neutralSoft },
                                ]}
                                accessibilityLabel={`Rank ${entry.rank}, ${entry.displayName}, ${formatEdge(entry.score)} versus holding`}
                            >
                                <ThemedText style={styles.rank}>{`#${entry.rank}`}</ThemedText>
                                <ThemedText style={styles.name} numberOfLines={1}>
                                    {entry.isMe ? `${entry.displayName} (you)` : entry.displayName}
                                </ThemedText>
                                <ThemedText style={[styles.edge, { color: edgeColor(entry.score) }]}>{formatEdge(entry.score)}</ThemedText>
                            </View>
                        ))}
                    </Card>
                ) : (
                    <EmptyState
                        title={kind === "week" && !board?.periodStart ? "No finished week yet" : "Nobody is ranked yet"}
                        message="Strategies appear once they have run live for 14 days and made 3 completed trades."
                    />
                )}

                <ThemedText type="muted" style={styles.caption}>{RULES_TEXT}</ThemedText>
                <ThemedText type="muted" style={styles.caption}>
                    Past results are not a prediction of future results. This is not financial advice.
                </ThemedText>
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    weekRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    profileCard: {
        gap: Spacing.sm,
    },
    mePlace: {
        gap: Spacing.xs,
    },
    list: {
        paddingVertical: Spacing.xs,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
    },
    rank: {
        ...Type.subtitle,
        minWidth: 44,
    },
    name: {
        flex: 1,
    },
    edge: {
        fontWeight: "600",
    },
    caption: {
        ...Type.caption,
    },
});
