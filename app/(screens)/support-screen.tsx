import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedView } from "@/components/ThemedView";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Linking, StyleSheet } from "react-native";
import { Routes } from "../Routes";

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
            <ThemedView style={styles.supportContainer}>
                <GeneralButton title="How It Works" onPress={goToHowItWorks} />
                <GeneralButton title="Contact Us" onPress={displayContactUs}/>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    supportContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        gap: 25
    }
})