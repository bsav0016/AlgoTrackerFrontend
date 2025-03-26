import React, { useCallback, useEffect, useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { Platform, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Routes } from "@/app/Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { ThemedView } from "@/components/ThemedView";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from "@/features/auth/AuthService";
import { PositionMapping } from "@/features/strategy/classes/Strategy";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { TestStrategies } from "@/features/strategy/testStrategies";
import { useFocusEffect } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";


const HomeScreen = () => {
    const { userRef, updateUserData } = useUser();
    const { accessToken, logout } = useAuth();
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();
    const { setStrategy } = useStrategy();

    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const expoPushTokenKey = 'expoPushToken';

        const initializeNotifications = async () => {
            if (Device.isDevice) {
                let previousToken: string | null = null;
                try {
                    previousToken = await AsyncStorage.getItem(expoPushTokenKey);
                } catch {
                    console.log("Could not get stored push token");
                }

                let existingStatus: Notifications.PermissionStatus;
                const returnedPermissions = await Notifications.getPermissionsAsync();
                if (Platform.OS === "ios") {
                    switch (returnedPermissions.ios?.status) {
                        case Notifications.IosAuthorizationStatus.AUTHORIZED, 
                            Notifications.IosAuthorizationStatus.PROVISIONAL,
                            Notifications.IosAuthorizationStatus.EPHEMERAL:
                            existingStatus = Notifications.PermissionStatus.GRANTED;
                            break;
                        case Notifications.IosAuthorizationStatus.DENIED:
                            existingStatus = Notifications.PermissionStatus.DENIED;
                            break;
                        default:
                            existingStatus = Notifications.PermissionStatus.UNDETERMINED;
                            break;
                    }
                } else {
                    existingStatus = returnedPermissions.status;
                }

                const newPushToken = (await Notifications.getDevicePushTokenAsync()).data;

                switch (existingStatus) {
                    case (Notifications.PermissionStatus.GRANTED):
                        if (newPushToken !== previousToken) {
                            if (accessToken) {
                                await AuthService.addDeviceId(accessToken, newPushToken);
                                if (previousToken !== null) {
                                    await AuthService.deleteDeviceId(accessToken, previousToken);
                                }
                            }
                            await AsyncStorage.setItem(expoPushTokenKey, newPushToken);
                        }
                        break;
                    case (Notifications.PermissionStatus.DENIED):
                        if (previousToken !== null) {
                            if (accessToken) {
                                await AuthService.deleteDeviceId(accessToken, previousToken);
                            }
                            await AsyncStorage.removeItem(expoPushTokenKey);
                        }
                        break;
                    default:
                        let finalStatus: Notifications.PermissionStatus;
                        const finalReturnedPermission = await Notifications.requestPermissionsAsync();
                        if (Platform.OS === "ios") {
                            switch (finalReturnedPermission.ios?.status) {
                                case Notifications.IosAuthorizationStatus.AUTHORIZED, 
                                    Notifications.IosAuthorizationStatus.PROVISIONAL,
                                    Notifications.IosAuthorizationStatus.EPHEMERAL:
                                    finalStatus = Notifications.PermissionStatus.GRANTED;
                                    break;
                                case Notifications.IosAuthorizationStatus.DENIED:
                                    finalStatus = Notifications.PermissionStatus.DENIED;
                                    break;
                                default:
                                    finalStatus = Notifications.PermissionStatus.UNDETERMINED;
                                    break;
                            }
                        } else {
                            finalStatus = finalReturnedPermission.status;
                        }

                        switch (finalStatus) {
                            case (Notifications.PermissionStatus.GRANTED):
                                if (accessToken) {
                                    await AuthService.addDeviceId(accessToken, newPushToken);
                                }
                                await AsyncStorage.setItem(expoPushTokenKey, newPushToken);
                                break;
                            default:
                                console.log("Permission not granted");
                                break;
                        }
                }
            }
        }

        if (Platform.OS === "ios" || Platform.OS === "android") {
            initializeNotifications();
        }
        
        setStrategy(null);
    }, []);

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
            const viewedStrategy = TestStrategies[index];
            //const viewedStrategy = userRef.current?.strategies[index]; TODO: This needs to be uncommented
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

    return (
        <>
        { loading ?
        <LoadingScreen loadingMessage="Refreshing data"/>
        :
        <CustomHeaderView header={`Welcome back, ${userRef.current?.firstName}!`} canGoBack={false} goProfile={true}>
            <ThemedView style={styles.buttonContainer}>
                <GeneralButton title="How it Works" onPress={goToHowItWorks} />
                <GeneralButton title="Run a Backtest" onPress={() => goToStrategySelection(StrategyType.Backtest)} />
                <GeneralButton title="Subscribe to a Strategy" onPress={() => goToStrategySelection(StrategyType.Subscription)} />
                <GeneralButton title="Support" onPress={goToSupport} />
            </ThemedView>
            
            <ThemedText style={styles.strategiesHeader}>Strategy Subscriptions:</ThemedText>
            <ThemedView style={styles.strategyContainer}>
                <ThemedText style={[styles.strategyTitleText, styles.columnHeaderText]}>Title</ThemedText>
                <ThemedText style={[styles.strategyPositionText, styles.columnHeaderText]}>Position</ThemedText>
                <ThemedText style={[styles.strategyReturnText, styles.columnHeaderText]}>Return</ThemedText>
            </ThemedView>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <ThemedView style={styles.strategiesContainer}>
                    
                    {TestStrategies.map((strategy, index) => (
                    /*{userRef.current?.strategies.map((strategy, index) => ( TODO: This needs to be uncommented*/
                        <TouchableOpacity onPress={() => goToViewStrategy(index)} key={index}>
                            <ThemedView style={[
                                styles.strategyContainer,
                                { backgroundColor: strategy.position < 1 ? 'red' : 
                                    strategy.position === 1 ? '#e87474' :
                                    strategy.position === 2 ? '#6dbf71':
                                    '#14871a'
                                }
                            ]}>
                                <ThemedText style={styles.strategyTitleText}>{strategy.title}</ThemedText>
                                <ThemedText style={styles.strategyPositionText}>{PositionMapping[strategy.position] ?? "Hold"}</ThemedText>
                                <ThemedText style={styles.strategyReturnText}>
                                    {((strategy.strategyReturn - 1) * 100).toFixed(1)}%
                                </ThemedText>
                            </ThemedView>
                        </TouchableOpacity>
                    ))
                    }
                </ThemedView>
            </ScrollView>
        </CustomHeaderView>
        }
        </>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 30,
        gap: 5,
        width: '75%',
        alignSelf: 'center'
    },

    strategiesHeader: {
        marginTop: 30,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 600,
        textDecorationLine: 'underline'
    },

    columnHeaderText: {
        fontWeight: 500,
        fontSize: 20,
        textDecorationLine: 'underline'
    },

    strategiesContainer: {
        alignSelf: 'center',
        width: '100%',
        gap: 10
    },    

    strategyContainer: {
        display: 'flex',
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: 'center'
    },

    strategyTitleText: {
        flex: 4,
        textAlign: 'center',
    },

    strategyPositionText: {
        flex: 3,
        textAlign: 'center',
    },

    strategyReturnText: {
        flex: 3,
        textAlign: 'center',
    }
})

export default HomeScreen;
