import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Linking, ScrollView, StyleSheet } from "react-native";
import { Routes } from "../Routes";
import { Spacing, Type } from "@/constants/Theme";

export default function Support() {
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();

    const displayContactUs = () => {
        const email = "savidgeapps@gmail.com";

        addToast(
            `The support team can be reached at ${email}`,
            [
                {
                    label: "Email Us",
                    callback: () => Linking.openURL(`mailto:${email}`)
                }
            ]
        );
    };

    const goToHowItWorks = () => {
        routeTo(Routes.HowItWorks)
    }

    return (
        <CustomHeaderView header="Support" displayFunds={false}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <ThemedText style={styles.cardTitle}>How it works</ThemedText>
                    <ThemedText type="muted">
                        What backtests and subscriptions do, and what each indicator input and result means.
                    </ThemedText>
                    <GeneralButton title="Read the guide" variant="outline" onPress={goToHowItWorks} autoWidth={false} />
                </Card>

                <Card style={styles.card}>
                    <ThemedText style={styles.cardTitle}>Contact us</ThemedText>
                    <ThemedText type="muted">
                        {"Billing questions, a payment that didn't go through, or anything that looks wrong."}
                    </ThemedText>
                    <GeneralButton title="Contact support" onPress={displayContactUs} autoWidth={false} />
                </Card>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    card: {
        gap: Spacing.md,
    },

    cardTitle: {
        ...Type.subtitle,
    },
})
