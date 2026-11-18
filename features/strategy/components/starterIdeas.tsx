import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";
import { STARTER_DISCLAIMER, STARTER_IDEAS, StarterIdea } from "../starterIdeas";

interface StarterIdeasProps {
    pickedId: string | null;
    onPick: (idea: StarterIdea) => void;
}

/** "Start from an idea": a few ready-made strategies that fill in the signals and exit rules below. */
export function StarterIdeas({ pickedId, onPick }: StarterIdeasProps) {
    const theme = useTheme();
    const picked = STARTER_IDEAS.find((idea) => idea.id === pickedId) ?? null;

    return (
        <View style={styles.wrapper}>
            <ThemedText style={styles.title}>Start from an idea</ThemedText>
            <Card style={styles.card}>
                {STARTER_IDEAS.map((idea) => {
                    const selected = idea.id === pickedId;
                    return (
                        <TouchableOpacity
                            key={idea.id}
                            onPress={() => onPick(idea)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${idea.name}. ${idea.summary}`}
                            style={[
                                styles.option,
                                { borderColor: selected ? theme.primary : theme.border },
                                selected && { borderWidth: 2 },
                            ]}
                        >
                            <ThemedText type="defaultSemiBold">{idea.name}</ThemedText>
                            <ThemedText type="muted" style={styles.summary}>{idea.summary}</ThemedText>
                        </TouchableOpacity>
                    );
                })}

                {picked ? (
                    <View style={styles.explain}>
                        <ThemedText style={styles.howItWorks}>{picked.howItWorks}</ThemedText>
                        <ThemedText type="muted" style={styles.note}>
                            The signals and exit rules below are filled in. Change anything you like, and choose a symbol, interval and dates.
                        </ThemedText>
                    </View>
                ) : (
                    <ThemedText type="muted" style={styles.note}>
                        Tap one to fill in the signals below, or build your own.
                    </ThemedText>
                )}
                <ThemedText type="muted" style={styles.note}>{STARTER_DISCLAIMER}</ThemedText>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: Spacing.sm,
    },

    title: {
        ...Type.subtitle,
    },

    card: {
        gap: Spacing.sm,
    },

    option: {
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: 2,
    },

    summary: {
        fontSize: 14,
    },

    explain: {
        gap: Spacing.sm,
        paddingTop: Spacing.xs,
    },

    howItWorks: {
        fontSize: 15,
        lineHeight: 22,
    },

    note: {
        ...Type.caption,
    },
});
