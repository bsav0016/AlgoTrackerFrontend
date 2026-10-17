import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { Routes } from "../Routes";
import { Keyboard, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Radius, Spacing, Type, useTheme } from "@/constants/Theme";

export default function Profile() {
    const { userRef, updateUserData } = useUser();
    const { accessToken, logout, deleteCurrentAccount } = useAuth();
    const { routeTo, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const theme = useTheme();
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [typedPassword, setTypedPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    if (!userRef || !userRef.current) {
        routeTo(Routes.Login);
        return;
    }
    const timeRemaining = (userRef.current.resetMonthlyCredits.getTime() - Date.now()) / 1000;

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

    const user = userRef.current;

    return (
        <CustomHeaderView header="Profile" displayFunds={false}>
            { loading ?
            <LoadingScreen loadingMessage={"Processing..."} />
            :
            <>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.identity}>
                    <ThemedText style={styles.name}>{`${user.firstName} ${user.lastName}`}</ThemedText>
                </View>

                <Card style={styles.creditsCard}>
                    <View style={styles.creditRow}>
                        <ThemedText type="muted">Account credits</ThemedText>
                        <ThemedText style={styles.creditValue}>{user.accountCredits}</ThemedText>
                    </View>
                    <View style={[styles.creditRow, styles.creditRowDivider, { borderColor: theme.border }]}>
                        <ThemedText type="muted">Free monthly credits</ThemedText>
                        <ThemedText style={styles.creditValue}>{user.monthlyCredits}</ThemedText>
                    </View>
                    <View style={[styles.creditRow, styles.creditRowDivider, { borderColor: theme.border }]}>
                        <ThemedText type="muted">Monthly credits reset in</ThemedText>
                        <CountdownTimer timeRemaining={timeRemaining} whenZero={triggerUserUpdate} alignRight />
                    </View>
                </Card>

                <View style={styles.actions}>
                    <GeneralButton title="Deposit Funds" onPress={() => routeTo(Routes.DepositFunds)} autoWidth={false} />
                    <GeneralButton title="Log Out" variant="outline" onPress={logoutUser} autoWidth={false} />
                </View>

                <View style={[styles.dangerZone, { borderColor: theme.border }]}>
                    <ThemedText type="muted" style={styles.dangerText}>
                        Deleting your account permanently removes your strategies and remaining credits.
                    </ThemedText>
                    <GeneralButton
                        title="Delete Account"
                        variant="danger"
                        onPress={() => setDeleteModalVisible(true)}
                        autoWidth={false}
                    />
                </View>
            </ScrollView>

            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback accessible={false}>
                            <View style={[styles.modalContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <ThemedText style={styles.modalTitle}>Delete account?</ThemedText>
                                <ThemedText type="muted">
                                    {"This can't be undone. Enter your password to confirm."}
                                </ThemedText>
                                <TextField
                                    label="Password"
                                    value={typedPassword}
                                    onChangeText={(newText) => setTypedPassword(newText)}
                                    returnKeyType={'done'}
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />
                                <View style={styles.modalButtons}>
                                    <View style={styles.modalButton}>
                                        <GeneralButton title="Cancel" variant="secondary" onPress={() => setDeleteModalVisible(false)} autoWidth={false} />
                                    </View>
                                    <View style={styles.modalButton}>
                                        <GeneralButton title="Delete" variant="danger" onPress={() => deleteAccount()} autoWidth={false} />
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            </>
            }
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.xl,
    },

    identity: {
        alignItems: 'center',
        paddingTop: Spacing.sm,
    },

    name: {
        ...Type.title,
        textAlign: 'center',
    },

    creditsCard: {
        paddingVertical: Spacing.sm,
    },

    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },

    creditRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },

    creditValue: {
        ...Type.bodyStrong,
    },

    actions: {
        gap: Spacing.md,
    },

    dangerZone: {
        gap: Spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: Spacing.xl,
    },

    dangerText: {
        fontSize: 14,
        textAlign: 'center',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        padding: Spacing.xl,
    },

    modalContainer: {
        width: '100%',
        maxWidth: 380,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        gap: Spacing.lg,
    },

    modalTitle: {
        ...Type.subtitle,
    },

    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },

    modalButton: {
        flex: 1,
    },
})
