import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUser } from "@/contexts/UserContext";
import { StyleSheet, TextInput, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function DepositFundsScreen() {
    const { userRef } = useUser();
    const textInputColor = useThemeColor({}, 'text');
    const [addAmount, setAddAmount] = useState<string>("$0.00");

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "");
        const cents = parseInt(numericValue || "0", 10);
        const dollars = (cents / 100).toFixed(2);
        return `$${dollars}`;
    };

    const handleAmountChange = (input: string) => {
        if (!/^\d*$/.test(input.replace(/\D/g, ""))) return;
        setAddAmount(formatCurrency(input));
    };

    const clickedDepositFunds = () => {
        console.log("Clicked deposit funds");
        // TODO: Implement Apple Pay API
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <CustomHeaderView header="Deposit Funds">
                    <ThemedView style={styles.mainView}>
                        <ThemedText>{`Available funds: $${userRef.current?.accountFunds}`}</ThemedText>

                        <ThemedView style={styles.addAmountView}>
                            <ThemedText>Amount to add:</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textInputColor }]}
                                keyboardType="numeric"
                                returnKeyType="done"
                                value={addAmount}
                                onChangeText={handleAmountChange}
                                onSubmitEditing={Keyboard.dismiss}
                            />
                        </ThemedView>

                        <GeneralButton title="Deposit Funds" onPress={clickedDepositFunds} />
                    </ThemedView>
                </CustomHeaderView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 50
    },
    addAmountView: {
        alignItems: "center",
        gap: 10,
        marginTop: 50,
        marginBottom: 30,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        fontSize: 18,
        width: 100,
        textAlign: "center",
    },
});
