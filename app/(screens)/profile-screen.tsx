import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { Routes } from "../Routes";
import { Keyboard, Modal, StyleSheet, TextInput, TouchableWithoutFeedback } from "react-native";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/contexts/ToastContext";
import { useEffect, useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Profile() {
    const { userRef, updateUserData } = useUser();
    const { accessToken, logout, deleteCurrentAccount } = useAuth();
    const { routeTo, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const color = useThemeColor({}, 'text');
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [typedPassword, setTypedPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    if (!userRef || !userRef.current) {
        routeTo(Routes.Login);
        return;
    }
    const timeRemaining = (userRef.current.resetMonthlyCredits.getTime() - Date.now()) / 1000;

    useEffect(() => {}, [userRef.current]);

    const logoutUser = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const triggerUserUpdate = async () => {
        if (!accessToken) {
            addToast("Could not update user monthly funds. Please try logging out and back in");
            return;
        }
        try {
            await updateUserData(accessToken);
        } catch {
            addToast("Could not update monthly funds. Please try logging out and back in");
        }
    }

    const deleteAccount = async () => {
        if (!accessToken) {
            addToast("Could not properly delete account. Please try logging out and back in");
            return;
        }
        setLoading(true);
        try {
            await deleteCurrentAccount(typedPassword);
            addToast("Account deleted successfully");
            routeReplace(Routes.Login);
        } catch (error) {
            addToast("Error deleting account. Please ensure your password is correct");
        } finally {
            setLoading(false);
            setDeleteModalVisible(false);
        }
    }

    return (
        <CustomHeaderView header="Profile">
            { loading ?
            <LoadingScreen loadingMessage={"Processing..."} />
            :
            <>
            <ThemedView style={styles.profileContainer}>
                <ThemedText type="subtitle">{`Account credits: ${userRef.current?.accountCredits}`}</ThemedText>
                <ThemedText type="subtitle">{`Free monthly credits: ${userRef.current?.monthlyCredits}`}</ThemedText>
                <ThemedView style={styles.resetContainer}>
                    <ThemedText>Monthly funds reset in: </ThemedText>
                    <CountdownTimer timeRemaining={timeRemaining} whenZero={triggerUserUpdate}/>
                </ThemedView>
                
                <GeneralButton title="Deposit Funds" onPress={() => routeTo(Routes.DepositFunds)} />
                <GeneralButton title="Logout" onPress={logoutUser} />
                <GeneralButton title="Delete Account" onPress={() => setDeleteModalVisible(true)} backgroundColor="red"/>
            </ThemedView>

            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
                    <ThemedView style={styles.modalOverlay}>
                        <ThemedView style={styles.modalContainer}>
                            <ThemedText>Please enter your password:</ThemedText>
                            <TextInput
                                value={typedPassword}
                                onChangeText={(newText) => setTypedPassword(newText)}
                                style={[
                                    styles.textInput,
                                    { color: color, borderColor: color }
                                ]}
                                returnKeyType={'done'}
                                secureTextEntry={true}
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            <GeneralButton title="Cancel" onPress={() => setDeleteModalVisible(false)} />
                            <GeneralButton title="Confirm Delete" onPress={() => deleteAccount()}  backgroundColor="red"/>
                        </ThemedView>
                    </ThemedView>
                </TouchableWithoutFeedback>
            </Modal>
            </>
            }
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
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },

    modalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 10,
        width: '90%',
    },

    textInput: {
        borderWidth: 1,
        borderRadius: 3,
        padding: 5,
        margin: 3,
        fontSize: 20,
        height: 30,
        width: '70%',
    }
})