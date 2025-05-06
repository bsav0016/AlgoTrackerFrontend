import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUser } from "@/contexts/UserContext";
import { StyleSheet, TextInput, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ScrollView, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { initPaymentSheet, presentPaymentSheet, StripeProvider }  from "@stripe/stripe-react-native";
import Constants from 'expo-constants';
import { PaymentService } from "@/features/payment/PaymentService";
import { PaymentSheetResponseDTO } from "@/features/payment/dtos/PaymentSheetResponseDTO";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { useAuth } from "@/contexts/AuthContext";
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { LoadingScreen } from "@/components/LoadingScreen";


export default function DepositFundsScreen() {
    const merchantId = Constants.expoConfig?.plugins?.find(
        (p) => p[0] === "@stripe/stripe-react-native"
    )?.[1].merchantIdentifier
    const stripePublicKey = Constants.expoConfig?.extra?.STRIPE_PUBLIC_KEY;
    if (!merchantId || !stripePublicKey) {
        throw new Error("Missing expo config for '@stripe/stripe-react-native'");
    }

    const APIKeys = {
        apple: "appl_ZJjqsVTnMmTiQubGSjQmQOxVtIi",
        google: "your_revenuecat_google_api_key",
    };

    const { userRef } = useUser();
    const { addToast } = useToast();
    const { accessToken } = useAuth();
    const { routeReplace } = useRouteTo();
    const textInputColor = useThemeColor({}, 'text');
    const [addAmount, setAddAmount] = useState<string>("$0.00");
    const [additionalCredits, setAdditionalCredits] = useState<number>(0);
    const [paymentSheet, setPaymentSheet] = useState<PaymentSheetResponseDTO | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);

    useEffect(() => {
        const setup = async () => {
            if (Platform.OS === "ios") {
                await Purchases.configure({ apiKey: APIKeys.apple });
            }/* else {
                await Purchases.configure({ apiKey: APIKeys.android });
            }*/

            const offerings = await Purchases.getOfferings();
            const currentOffering = offerings.current;
            
            if (currentOffering) {
                setPackages(currentOffering.availablePackages);
            }
        };

        if (Platform.OS === "ios") {
            setLoadingMessage("Preparing payment options...");
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);

            const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
                updateCustomerInfo(customerInfo);
            };
            Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

            setup()
                .catch(console.log);

            setLoadingMessage(null);

            return () => {
                Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
            };
        }
    }, []);

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
                setLoadingMessage(null);
            } else {
                await openPaymentSheet();
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
        setLoadingMessage("Processing payment...");
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
            setLoadingMessage(null);
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
        setLoadingMessage(null);
    }

    const purhcasePackage = async (pack: PurchasesPackage) => {
        try {
            setLoadingMessage("Processing payment...");
            await Purchases.purchasePackage(pack);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.toLowerCase().includes('cancelled')) {
                    console.log("User cancelled payment");
                } else {
                    console.log('Error processing revenue cat payment: ', error.message);
                    addToast('Error processing payment');
                }
            }
            else {
                console.error('Unknown error processing revenue cat payment: ', error);
                addToast("Unknown error occurred");
            }
        }
    }

    const onPurchase = (pack: PurchasesPackage) => {
        purhcasePackage!(pack)
    }

    const updateCustomerInfo = async (customerInfo: CustomerInfo) => {
        const latestTransaction = customerInfo.nonSubscriptionTransactions?.sort(
            (a, b) => (new Date(b.purchaseDate)).getTime() - (new Date(a.purchaseDate)).getTime()
        )?.[0];

        if (!latestTransaction) {
            return;
        }
    
        if (Date.now() - new Date(latestTransaction.purchaseDate).getTime() < 20000) {
            if (!accessToken) {
                addToast("Please log back in. If your card has been charged, please contact the support team")
                routeReplace(Routes.Login);
                return;
            }
            try {
                const completed = await PaymentService.processRevenueCatCustomer(accessToken, customerInfo.originalAppUserId);
                if (completed) {
                    addToast("Payment processed successfully");
                } else {
                    addToast("Payment confirmed, but not yet processed. Please reach out to support (at savidgeapps@gmail.com) if it hasn't been processed in the next 5 minutes")
                }
                routeReplace(Routes.Home);
            } catch (error) {
                console.error(error);
                addToast("Error processing payment. If your card has been charged, please reach out to the support team at savidgeapps@gmail.com");
            }
        }
        
        setLoadingMessage(null);
    };

    function RevenueCatComponent() {
        return (
            <ThemedView style={styles.packageScrollViewContainer}>
                {packages.map((pack) => (
                    <TouchableOpacity 
                        key={pack.product.identifier} 
                        onPress={() => onPurchase(pack)}
                        style={styles.packageContainer}
                    >
                        <ThemedView style={styles.packageTextContainer}>
                            <ThemedText>{pack.product.title}:</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.packageButton}>
                            <GeneralButton title={pack.product.priceString} onPress={() => onPurchase(pack)} />
                        </ThemedView>
                    </TouchableOpacity>
                ))}
            </ThemedView>
        );
    }

    return (
        <StripeProvider
                publishableKey={stripePublicKey}
                merchantIdentifier={merchantId}
            >
            <CustomHeaderView header="Deposit Funds">
                { loadingMessage !== null ?
                <LoadingScreen loadingMessage={loadingMessage}/>
                : Platform.OS === "ios" ?
                <ScrollView keyboardShouldPersistTaps="handled">
                    <ThemedText style={styles.iosText}>Option 1: $1=100 credits:</ThemedText>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <KeyboardAvoidingView
                            behavior="padding"
                            style={styles.container}
                        >
                            <ThemedView style={styles.mainView}>
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
                                
                                <GeneralButton title="Enter Card Details" onPress={clickedEnterCardDetails} />
                            </ThemedView>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                    <ThemedView style={{ borderWidth: 1, width: '100%', marginBottom: 10, borderColor: textInputColor }}/>
                    <ThemedText style={styles.iosText}>Option 2: $1=70 credits (due to commission fees):</ThemedText>
                    <RevenueCatComponent/>
                </ScrollView>
                :
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView
                        behavior="height"
                        style={styles.container}
                    >
                        <ThemedView style={styles.mainView}>
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
                            
                            <GeneralButton title="Enter Card Details" onPress={clickedEnterCardDetails} />
                        </ThemedView>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
                }
            </CustomHeaderView>
        </StripeProvider>
    );
    
}

const styles = StyleSheet.create({
    iosView: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iosText: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 600
    },
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
    packageScrollViewContainer: {
        marginTop: 20,
        width: '100%'
    },
    packageContainer: {
        display: 'flex',
        flexDirection: 'row',
        margin: 15,
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
    },
    packageTextContainer: {
        flex: 3
    },
    packageButton: {
        flex: 2
    }
});
