import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { Routes } from "../Routes";
import { StyleSheet } from "react-native";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/contexts/ToastContext";
import { useEffect } from "react";

export default function Profile() {
    const { userRef, updateUserData } = useUser();
    const { accessToken, logout } = useAuth();
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();

    if (!userRef || !userRef.current) {
        routeTo(Routes.Login);
        return;
    }
    const timeRemaining = (userRef.current.resetMonthlyFunds.getTime() - Date.now()) / 1000;

    useEffect(() => {}, [userRef.current]);

    const logoutUser = async () => {
        await logout();
    }

    const triggerUserUpdate = async () => {
        if (!accessToken) {
            addToast("Could not update user monthly funds. Please try logging out and back in");
            return;
        }
        try {
            updateUserData(accessToken);
        } catch {
            addToast("Could not update monthly funds. Please try logging out and back in");
        }
    }

    return (
        <CustomHeaderView header="Profile">
            <ThemedView style={styles.profileContainer}>
                <ThemedText type="subtitle">{`Account funds: $${userRef.current?.accountFunds}`}</ThemedText>
                <ThemedText type="subtitle">{`Free monthly funds: $${userRef.current?.monthlyFunds}`}</ThemedText>
                <ThemedView style={styles.resetContainer}>
                    <ThemedText>Monthly funds reset in: </ThemedText>
                    <CountdownTimer timeRemaining={timeRemaining} whenZero={triggerUserUpdate}/>
                </ThemedView>
                
                <GeneralButton title="Deposit Funds" onPress={() => routeTo(Routes.DepositFunds)} />
                <GeneralButton title="Logout" onPress={logoutUser} />
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    profileContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },

    resetContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }
})