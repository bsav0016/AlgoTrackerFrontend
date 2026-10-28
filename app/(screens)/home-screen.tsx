import React, { useCallback, useEffect, useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Routes } from "@/app/Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { Card } from "@/components/Card";
import { Badge, BadgeTone } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Spacing, Type, useTheme } from "@/constants/Theme";
import * as Notifications from 'expo-notifications';
import { PositionMapping } from "@/features/strategy/classes/Strategy";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { TestStrategies } from "@/features/strategy/testStrategies";
import { useFocusEffect } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useOpenStrategyOnNotificationTap } from "@/features/notifications/useOpenStrategy";


Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const HomeScreen = () => {
    const { user, updateUserData } = useUser();
    const { accessToken, logout } = useAuth();
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();
    const { setStrategy } = useStrategy();
    const theme = useTheme();

    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        setStrategy(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- clear the selection once, when the screen opens
    }, []);

    useOpenStrategyOnNotificationTap();

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const doUpdateUser = async () => {
                if (accessToken) {
                    try {
                        setLoading(true);
                        await updateUserData(accessToken);
                    } catch {
                        addToast("Error retreiving user details. Please log back in.")
                        await logout();
                    } finally {
                        setLoading(false);
                    }
                }
            }
            
            doUpdateUser();

            return () => {
                active = false;
            }
        }, [])
    );

    const goToStrategySelection = (strategyType: StrategyType) => {
        routeTo(Routes.StrategySelection, { strategyType });
    }

    const goToSupport = () => {
        routeTo(Routes.Support);
    }

    const goToHowItWorks = () => {
        routeTo(Routes.HowItWorks);
    }

    const goToViewStrategy = (index: number) => {
        try {
            //const viewedStrategy = TestStrategies[index]; //Can use example strategies here
            const viewedStrategy = user?.strategies[index];
            if (!viewedStrategy) {
                addToast("Error opening strategy. Please try again later")
                return;
            }
            setStrategy(viewedStrategy);
            routeTo(Routes.ViewStrategy);
        } catch (error) {
            addToast("Error processing strategy");
        }
    }

    const positionTone = (position: number): BadgeTone =>
        position < 1 ? "loss" : position > 2 ? "gain" : "neutral";

    return (
        <>
        { loading ?
        <LoadingScreen loadingMessage="Refreshing data"/>
        :
        <CustomHeaderView header={`Welcome back, ${user?.firstName}!`} canGoBack={false} goProfile={true}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <GeneralButton title="Run a Backtest" onPress={() => goToStrategySelection(StrategyType.Backtest)} autoWidth={false} />
                <GeneralButton title="Subscribe to a Strategy" variant="outline" onPress={() => goToStrategySelection(StrategyType.Subscription)} autoWidth={false} />

                <ThemedText style={styles.sectionHeader}>Your strategies</ThemedText>

                {/*{TestStrategies.map((strategy, index) => ( can use example strategies here*/}
                {user?.strategies.length ? user.strategies.map((strategy, index) => {
                    const returnPct = (strategy.strategyReturn - 1) * 100;
                    return (
                        <TouchableOpacity
                            onPress={() => goToViewStrategy(index)}
                            key={index}
                            accessibilityRole="button"
                            accessibilityLabel={`${strategy.title}, ${PositionMapping[strategy.position] ?? "Hold"}, return ${returnPct.toFixed(1)} percent`}
                        >
                            <Card style={styles.strategyCard}>
                                <View style={styles.strategyInfo}>
                                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{strategy.title}</ThemedText>
                                    <Badge label={PositionMapping[strategy.position] ?? "Hold"} tone={positionTone(strategy.position)} />
                                </View>
                                <ThemedText style={[styles.returnText, { color: returnPct >= 0 ? theme.gain : theme.loss }]}>
                                    {`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}%`}
                                </ThemedText>
                            </Card>
                        </TouchableOpacity>
                    );
                }) : (
                    <EmptyState
                        title="No subscriptions yet"
                        message="Build a strategy and subscribe to get a push notification when it signals a trade."
                    />
                )}

                <View style={styles.footerLinks}>
                    <GeneralButton title="How it Works" variant="ghost" onPress={goToHowItWorks} />
                    <GeneralButton title="Support" variant="ghost" onPress={goToSupport} />
                </View>
            </ScrollView>
        </CustomHeaderView>
        }
        </>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },

    sectionHeader: {
        ...Type.subtitle,
        marginTop: Spacing.lg,
    },

    strategyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },

    strategyInfo: {
        flex: 1,
        gap: Spacing.xs,
    },

    returnText: {
        ...Type.subtitle,
    },

    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
})

export default HomeScreen;
