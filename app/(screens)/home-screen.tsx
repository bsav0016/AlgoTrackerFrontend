import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import React, { useEffect } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { Routes } from "./Routes";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { ThemedView } from "@/components/ThemedView";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from "@/features/auth/AuthService";


export default function Home() {
    const { userRef } = useUser();
    const { tokenRef } = useAuth();
    const { routeTo } = useRouteTo();

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
                            if (tokenRef.current) {
                                await AuthService.addDeviceId(tokenRef.current, newPushToken);
                                if (previousToken !== null) {
                                    await AuthService.deleteDeviceId(tokenRef.current, previousToken);
                                }
                            }
                            await AsyncStorage.setItem(expoPushTokenKey, newPushToken);
                        }
                        break;
                    case (Notifications.PermissionStatus.DENIED):
                        if (previousToken !== null) {
                            if (tokenRef.current) {
                                await AuthService.deleteDeviceId(tokenRef.current, previousToken);
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
                                if (tokenRef.current) {
                                    await AuthService.addDeviceId(tokenRef.current, newPushToken);
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

        initializeNotifications();
    }, []);

    const goToStrategy = (strategyType: StrategyType) => {
        routeTo(Routes.StrategySelection, { strategyType });
    }

    const goToDeposit = () => {
        routeTo(Routes.DepositFunds);
    }

    const goToHowItWorks = () => {
        routeTo(Routes.HowItWorks);
    }

    return (
        <CustomHeaderView header={`Welcome back, ${userRef.current?.firstName}!`} canGoBack={false}>
            <ThemedView style={styles.buttonContainer}>
                <GeneralButton title="How it Works" onPress={goToHowItWorks} />
                <GeneralButton title="Run a Backtest" onPress={() => goToStrategy(StrategyType.Backtest)} />
                <GeneralButton title="Subscribe to a Strategy" onPress={() => goToStrategy(StrategyType.Subscription)} />
                <GeneralButton title="Deposit Funds" onPress={goToDeposit} />
            </ThemedView>
            
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <ThemedView style={styles.strategiesContainer}>
                    <ThemedText style={styles.strategiesHeader}>Strategy Subscriptions:</ThemedText>
                    {userRef.current?.strategies.map((strategy, index) => (
                        <ThemedView key={index}>
                            <ThemedText>Place strategy here!</ThemedText>
                        </ThemedView>
                    ))
                    }
                </ThemedView>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 30,
        gap: 5,
        width: '75%',
        alignSelf: 'center'
    },

    strategiesContainer: {
        marginTop: 30,
        alignSelf: 'center'
    },

    strategiesHeader: {
        fontWeight: 600
    },
})