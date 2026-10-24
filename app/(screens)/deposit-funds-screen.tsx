import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { Spacing, Type } from "@/constants/Theme";
import { useUser } from "@/contexts/UserContext";
import { StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ScrollView, View } from "react-native";
import { useEffect, useState } from "react";
import { GeneralButton } from "@/components/GeneralButton";
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
            <View style={styles.packages}>
                {packages.map((pack) => (
                    <Card key={pack.product.identifier} style={styles.packageCard}>
                        <ThemedText style={styles.packageTitle}>{pack.product.title}</ThemedText>
                        <View style={styles.packageButton}>
                            <GeneralButton title={pack.product.priceString} onPress={() => onPurchase(pack)} autoWidth={false} />
                        </View>
                    </Card>
                ))}
            </View>
        );
    }

    const amountForm = (
        <Card style={styles.formCard}>
            <TextField
                label="Amount to add"
                keyboardType="numeric"
                returnKeyType="done"
                value={addAmount}
                onChangeText={handleAmountChange}
                onSubmitEditing={Keyboard.dismiss}
            />
            <ThemedText type="muted" style={styles.creditsPreview}>
                {`You'll receive ${additionalCredits.toLocaleString("en-US")} credits ($1 = 100 credits, $5 minimum)`}
            </ThemedText>
            <GeneralButton title="Enter Card Details" onPress={clickedEnterCardDetails} autoWidth={false} />
        </Card>
    );

    return (
        <StripeProvider
                publishableKey={stripePublicKey}
                merchantIdentifier={merchantId}
            >
            <CustomHeaderView header="Deposit Funds">
                { loadingMessage !== null ?
                <LoadingScreen loadingMessage={loadingMessage}/>
                :
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            <View style={styles.stack}>
                                { Platform.OS === "ios" &&
                                    <ThemedText style={styles.optionTitle}>Option 1: card ($1 = 100 credits)</ThemedText>
                                }
                                {amountForm}
                                { Platform.OS === "ios" &&
                                <>
                                    <ThemedText style={styles.optionTitle}>Option 2: in-app purchase ($1 = 100 credits)</ThemedText>
                                    <RevenueCatComponent/>
                                </>
                                }
                            </View>
                        </TouchableWithoutFeedback>
                    </ScrollView>
                </KeyboardAvoidingView>
                }
            </CustomHeaderView>
        </StripeProvider>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    stack: {
        gap: Spacing.lg,
    },
    optionTitle: {
        ...Type.bodyStrong,
    },
    formCard: {
        gap: Spacing.lg,
    },
    creditsPreview: {
        fontSize: 14,
    },
    packages: {
        gap: Spacing.md,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    packageTitle: {
        flex: 3,
        ...Type.bodyStrong,
    },
    packageButton: {
        flex: 2,
    },
});
