import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ScrollView } from "react-native";


export default function Home() {
    return (
        <CustomHeaderView header="Welcome, user!">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <ThemedText>Welcome!</ThemedText>
            </ScrollView>
        </CustomHeaderView>
    )
}