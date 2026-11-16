import { StyleSheet, View } from "react-native";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type } from "@/constants/Theme";
import { EXIT_RULE_NAMES, ExitRuleInputs, ExitRuleName } from "../classes/ExitRules";

interface ExitRulesSectionProps {
    inputs: ExitRuleInputs;
    setInputs: (inputs: ExitRuleInputs) => void;
}

const FIELDS: Record<ExitRuleName, { label: string; hint: string }> = {
    stop_loss: { label: "Stop-loss (%)", hint: "Sell if the price falls this far below the buy price" },
    trailing_stop: { label: "Trailing stop (%)", hint: "Sell if it falls this far below its highest point since the buy" },
    take_profit: { label: "Take-profit (%)", hint: "Sell if the price rises this far above the buy price" },
};

/** Optional exits that depend on the buy price. Blank means off. */
export function ExitRulesSection({ inputs, setInputs }: ExitRulesSectionProps) {
    return (
        <View style={styles.section}>
            <ThemedText style={styles.title}>Exit rules (optional)</ThemedText>
            <Card style={styles.card}>
                {EXIT_RULE_NAMES.map((name) => (
                    <View key={name}>
                        <TextField
                            label={FIELDS[name].label}
                            placeholder="Off"
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                            value={inputs[name]}
                            onChangeText={(text) => setInputs({ ...inputs, [name]: text })}
                        />
                        <ThemedText type="muted" style={styles.hint}>{FIELDS[name].hint}</ThemedText>
                    </View>
                ))}
                <ThemedText type="muted" style={styles.hint}>
                    Checked on each candle's close, on top of your sell signals. After an exit it waits for your buy signals to
                    stop holding before buying again.
                </ThemedText>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.sm,
    },

    title: {
        ...Type.subtitle,
    },

    card: {
        gap: Spacing.md,
    },

    hint: {
        ...Type.caption,
        paddingTop: Spacing.xs,
    },
});
