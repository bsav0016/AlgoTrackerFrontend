import React, { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle, View } from "react-native";
import { useRouter } from "expo-router";
import { useRouteTo } from "@/contexts/RouteContext";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { Routes } from "@/app/Routes";
import { useUser } from "@/contexts/UserContext";
import { MIN_TOUCH, Radius, Spacing, Type, useTheme } from "@/constants/Theme";


interface CustomHeaderProps {
    header: string;
    children: ReactNode;
    canGoBack?: Boolean;
    goBack?: () => void,
    style?: StyleProp<ViewStyle>;
    goProfile?: Boolean;
    displayFunds?: boolean;
}

export function CustomHeaderView({
    header,
    children,
    canGoBack=true,
    goBack,
    style,
    goProfile=false,
    displayFunds=true
}: CustomHeaderProps) {
    const router = useRouter();
    const { routeTo } = useRouteTo();
    const { user } = useUser();
    const theme = useTheme();

    const handleBackPress = goBack || router.back

    return (
        <ThemedView style={[styles.screenView, style]}>
            <View style={styles.headerView}>
                <View style={styles.slot}>
                    {canGoBack &&
                        <TouchableOpacity
                            onPress={handleBackPress}
                            style={styles.iconButton}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="chevron-back" size={26} color={theme.primary} />
                        </TouchableOpacity>
                    }
                </View>

                <ThemedText style={styles.headerText} numberOfLines={1}>
                    {header}
                </ThemedText>

                <View style={[styles.slot, styles.slotRight]}>
                    {goProfile &&
                        <TouchableOpacity
                            onPress={() => routeTo(Routes.Profile)}
                            style={styles.iconButton}
                            accessibilityRole="button"
                            accessibilityLabel="Profile"
                        >
                            <Ionicons name="person-circle-outline" size={28} color={theme.primary} />
                        </TouchableOpacity>
                    }
                </View>
            </View>

            { (displayFunds && user) &&
                <View style={[styles.creditsChip, { backgroundColor: theme.neutralSoft }]}>
                    <Ionicons name="wallet-outline" size={14} color={theme.mutedText} />
                    <ThemedText type="muted" style={styles.creditsText}>
                        {`${user.accountCredits} credits · ${user.monthlyCredits} monthly`}
                    </ThemedText>
                </View>
            }

            <ThemedView style={styles.contentView}>
                {children}
            </ThemedView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    screenView: {
        flex: 1,
        flexDirection: 'column'
    },

    headerView: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: Spacing.sm,
    },

    slot: {
        width: MIN_TOUCH,
        alignItems: 'flex-start',
    },

    slotRight: {
        alignItems: 'flex-end',
    },

    iconButton: {
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerText: {
        ...Type.subtitle,
        flex: 1,
        textAlign: 'center',
    },

    creditsChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.pill,
        marginBottom: Spacing.sm,
    },

    creditsText: {
        ...Type.caption,
    },

    contentView: {
        flex: 1,
    }
})
