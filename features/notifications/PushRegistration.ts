import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "@/features/auth/AuthService";

/** The push token this phone last registered, kept so sign-out can remove exactly that one. */
export const PUSH_TOKEN_KEY = "expoPushToken";

/** This phone's Expo push token, asking for permission if needed. Null when there is none to be had (a simulator,
 *  permission refused, no EAS project id, no network); the reason is logged, never shown. */
export async function getPushToken(): Promise<string | null> {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
    if (!Device.isDevice) {
        console.warn("Push notifications need a physical device");
        return null;
    }
    try {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }
        const { status: existing } = await Notifications.getPermissionsAsync();
        const status = existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") {
            console.warn("Permission not granted for push notifications");
            return null;
        }
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.warn("No EAS project id, so no push token");
            return null;
        }
        return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
        console.warn("Could not get a push token:", error);
        return null;
    }
}

/** Binds this phone's push token to the signed-in account. Called after every sign-in (and app start while
 *  signed in), because the server moves a token to whichever account registers it last, which is what keeps a
 *  shared phone's pushes with the account that is signed in. Never throws; returns whether it registered. */
export async function registerPushToken(accessToken: string): Promise<boolean> {
    const token = await getPushToken();
    if (!token) return false;
    try {
        await AuthService.addDeviceId(accessToken, token, Platform.OS);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        return true;
    } catch (error) {
        console.warn("Could not register the push token:", error);
        return false;
    }
}

/** Removes this phone's token from the signed-in account (call before signing out). Never throws. The stored
 *  copy is cleared even if the request fails: the next account to register the token takes it over anyway. */
export async function unregisterPushToken(accessToken: string): Promise<void> {
    try {
        const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (!token) return;
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        await AuthService.deleteDeviceId(accessToken, token);
    } catch (error) {
        console.warn("Could not remove the push token:", error);
    }
}
