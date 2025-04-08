import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUser } from "@/contexts/UserContext";
import { StyleSheet, TextInput, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { useEffect, useState } from "react";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { initPaymentSheet, presentPaymentSheet, StripeProvider }  from "@stripe/stripe-react-native";
import Constants from 'expo-constants';
import { PaymentService } from "@/features/payment/PaymentService";
import { PaymentSheetResponseDTO } from "@/features/payment/PaymentSheetResponseDTO";
import { useToast } from "@/contexts/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { useAuth } from "@/contexts/AuthContext";


export default function DepositFundsScreen() {
    const merchantId = Constants.expoConfig?.plugins?.find(
        (p) => p[0] === "@stripe/stripe-react-native"
    )?.[1].merchantIdentifier
    const stripePublicKey = Constants.expoConfig?.extra?.STRIPE_PUBLIC_KEY;
    if (!merchantId || !stripePublicKey) {
        throw new Error("Missing expo config for '@stripe/stripe-react-native'");
    }

    const { userRef } = useUser();
    const { addToast } = useToast();
    const { accessToken } = useAuth();
    const { routeReplace } = useRouteTo();
    const textInputColor = useThemeColor({}, 'text');
    const [addAmount, setAddAmount] = useState<string>("$0.00");
    const [additionalCredits, setAdditionalCredits] = useState<number>(0);
    const [paymentSheet, setPaymentSheet] = useState<PaymentSheetResponseDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const initializePaymentSheet = async () => {
            if (!paymentSheet || !userRef.current) return;
            const { error } = await initPaymentSheet({
                merchantDisplayName: "Savidge Apps",
                customerId: paymentSheet.customer,
                customerEphemeralKeySecret: paymentSheet.ephemeralKey,
                paymentIntentClientSecret: paymentSheet.paymentIntent,
                defaultBillingDetails: {
                    name: `${userRef.current.firstName} ${userRef.current.lastName}`
                }
            });
            
            if (error) {
                console.error(error);
                addToast("Error occured loading the payment details screen");
                setLoading(false);
            } else {
                await openPaymentSheet()
            }
        };

        initializePaymentSheet();
    }, [paymentSheet])

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "");
        const cents = parseInt(numericValue || "0", 10);
        const dollars = (cents / 100).toFixed(2);
        setAdditionalCredits(cents);
        return `$${dollars}`;
    };

    const handleAmountChange = (input: string) => {
        if (!/^\d*$/.test(input.replace(/\D/g, ""))) return;
        setAddAmount(formatCurrency(input));
    };

    const clickedEnterCardDetails = async () => {
        if (!accessToken) {
            addToast("Please try to log in again. User info not properly stored")
            return;
        }
        setLoading(true);
        try {
            const amountInCents = parseInt(addAmount.replace(/[^0-9]/g, ""), 10);
            if (amountInCents < 500) {
                addToast("$5 Minimum Deposit");
                return;
            }
            const paymentSheetDetails = await PaymentService.fetchPaymentSheetParams(accessToken, amountInCents);
            setPaymentSheet(paymentSheetDetails);
        } catch (error) {
            console.error(error);
            addToast("Error loading card details screen. Please verify your input amount");
            setPaymentSheet(null);
            setLoading(false);
        }
    }

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            addToast("Error completing payment");
        } else {
            addToast("Payment completed successfully!");
            routeReplace(Routes.Home);
        }
        setLoading(false);
    }
    

    return (
        <StripeProvider
            publishableKey={stripePublicKey}
            merchantIdentifier={merchantId}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <CustomHeaderView header="Deposit Funds">
                        <ThemedView style={styles.mainView}>
                            <ThemedText>{`Available credits: ${userRef.current?.accountCredits}`}</ThemedText>

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
                                <ThemedText>Credits: {additionalCredits}</ThemedText>
                            </ThemedView>

                            { loading ?
                                <LoadingSpinner />
                            :
                                <GeneralButton title="Enter Card Details" onPress={clickedEnterCardDetails} />
                            }
                        </ThemedView>
                    </CustomHeaderView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </StripeProvider>
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
