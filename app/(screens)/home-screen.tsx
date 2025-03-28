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
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from "@/features/auth/AuthService";
import { PositionMapping } from "@/features/strategy/classes/Strategy";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { TestStrategies } from "@/features/strategy/testStrategies";
import { useFocusEffect } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

function handleRegistrationError(errorMessage: string) {
    alert(errorMessage);
    throw new Error(errorMessage);
}
  
async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            handleRegistrationError('Permission not granted to get push token for push notification!');
            return;
        }
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log(pushTokenString);
            return pushTokenString;
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications');
    }
}

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
            let previousToken: string | null = null;
            try {
                previousToken = await AsyncStorage.getItem(expoPushTokenKey);
            } catch {
                console.log("Could not get stored push token");
            }
            const newPushToken = await registerForPushNotificationsAsync()

            if (newPushToken && newPushToken !== previousToken) {
                if (accessToken) {
                    await AuthService.addDeviceId(accessToken, newPushToken);
                    if (previousToken !== null) {
                        await AuthService.deleteDeviceId(accessToken, previousToken);
                    }
                }
                await AsyncStorage.setItem(expoPushTokenKey, newPushToken);
            }
        }

        if (Platform.OS === "ios" || Platform.OS === "android") {
            initializeNotifications();
        }

        setStrategy(null);

        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log("Notification received:", notification);
        });
    
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification clicked:", response);
        });
    
        return () => {
            if (notificationListener) {
                Notifications.removeNotificationSubscription(notificationListener);
            }
            if (responseListener) {
                Notifications.removeNotificationSubscription(responseListener);
            }
        };
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
            //const viewedStrategy = TestStrategies[index]; //Can use example strategies here
            const viewedStrategy = userRef.current?.strategies[index];
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
                    
                    {/*{TestStrategies.map((strategy, index) => ( can use example strategies here*/}
                    {userRef.current?.strategies.map((strategy, index) => (
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
