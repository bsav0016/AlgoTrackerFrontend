import { useEffect, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { Card } from "@/components/Card";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TextField } from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Type } from "@/constants/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useStrategy } from "@/contexts/StrategyContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { ExitRuleInputs, exitRulesToInputs, parseExitRules } from "@/features/strategy/classes/ExitRules";
import { Signal } from "@/features/strategy/classes/Signal";
import { EditIndicator } from "@/features/strategy/components/editIndicator";
import { ExitRulesSection } from "@/features/strategy/components/exitRulesSection";
import { IndicatorSection } from "@/features/strategy/components/indicatorSection";
import { indicators } from "@/features/strategy/enums/Indicator";
import { StrategyService } from "@/features/strategy/StrategyService";
import { MAX_TITLE_LENGTH, buildEditBody, startingFields, summarizeEdit, validateEdit } from "@/features/strategy/strategyEdit";

// A new signal with the default settings, as in the builder: the first indicator, target 50, a 14-period window.
const newSignal = (aboveTarget: boolean) => new Signal(indicators[0], 50, aboveTarget, 14, null, null, null);

/**
 * Change the title, signals and exit rules of a strategy you already have. The market and the candle interval are shown
 * but cannot be changed. Saving first shows what will change, and for a tracked strategy that its leaderboard results
 * start again from the moment of the change.
 */
export default function EditStrategyScreen() {
    const { strategy, setStrategy } = useStrategy();
    const { accessToken } = useAuth();
    const { updateUserData } = useUser();
    const { routeBack } = useRouteTo();
    const { addToast } = useToast();

    const [start] = useState(() => (strategy ? startingFields(strategy) : null));
    const [title, setTitle] = useState<string>(start?.title ?? "");
    const [buySignals, setBuySignals] = useState<Signal[]>(start?.buySignals ?? []);
    const [sellSignals, setSellSignals] = useState<Signal[]>(start?.sellSignals ?? []);
    const [exitInputs, setExitInputs] = useState<ExitRuleInputs>(() => exitRulesToInputs(start?.exitRules ?? {}));
    const [buyIndex, setBuyIndex] = useState<number | null>(null);
    const [sellIndex, setSellIndex] = useState<number | null>(null);
    const [reviewing, setReviewing] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (!strategy) {
            addToast("Could not load the strategy");
            routeBack();
        }
    }, [strategy, addToast, routeBack]);

    if (!strategy || !start) return <CustomHeaderView header="Edit strategy" displayFunds={false}><View /></CustomHeaderView>;

    const parsedExit = parseExitRules(exitInputs);
    const edited = { title, buySignals, sellSignals, exitRules: parsedExit.rules ?? {} };
    const summary = summarizeEdit(strategy, edited);
    const dirty = summary.lines.length > 0;
    // Only a tracked strategy has a leaderboard standing to restart; a draft is not tracked.
    const restartsStanding = summary.rulesChanged && strategy.active;

    const review = () => {
        if (parsedExit.error) {
            addToast(parsedExit.error);
            return;
        }
        const problem = validateEdit(edited);
        if (problem) {
            addToast(problem);
            return;
        }
        if (!dirty) {
            addToast("Nothing has changed yet");
            return;
        }
        Keyboard.dismiss();
        setReviewing(true);
    };

    const save = async () => {
        const body = buildEditBody(strategy, edited);
        if (!accessToken || body === null) return;
        setSaving(true);
        try {
            setStrategy(await StrategyService.updateStrategy(strategy.id, body, accessToken));
            try {
                await updateUserData(accessToken);
            } catch {
                // The edit is saved; the home list refreshes the next time it loads.
            }
            addToast(restartsStanding
                ? "Saved. The new rules apply from the next candle, and the leaderboard counts results from now."
                : "Saved.");
            routeBack();
        } catch (error: any) {
            addToast(error?.status === 404
                ? "That strategy is no longer there"
                : "Could not save the changes. Check the rules and try again");
            setReviewing(false);
        } finally {
            setSaving(false);
        }
    };

    const leave = () => {
        if (dirty) {
            addToast("Discard your changes?", [{ label: "Discard", callback: routeBack }]);
        } else {
            routeBack();
        }
    };

    const goBack = () => {
        if (buyIndex !== null) setBuyIndex(null);
        else if (sellIndex !== null) setSellIndex(null);
        else if (reviewing) setReviewing(false);
        else leave();
    };

    // The buy list always keeps one signal (a strategy needs one); the sell list may be emptied.
    const changeBuy = (next: Signal[]) => setBuySignals(next.length > 0 ? next : [newSignal(true)]);

    return (
        <CustomHeaderView header={buyIndex !== null || sellIndex !== null ? "Edit signal" : "Edit strategy"} goBack={goBack} displayFunds={false}>
            {saving ?
                <LoadingScreen loadingMessage="Saving..." />
                : buyIndex !== null ?
                    <EditIndicator signals={buySignals} setSignals={changeBuy} indicatorIndex={buyIndex} setIndicatorIndex={setBuyIndex} />
                    : sellIndex !== null ?
                        <EditIndicator signals={sellSignals} setSignals={setSellSignals} indicatorIndex={sellIndex} setIndicatorIndex={setSellIndex} />
                        : reviewing ?
                            <ScrollView contentContainerStyle={styles.content}>
                                <ThemedText style={styles.sectionTitle}>Review your changes</ThemedText>
                                <Card style={styles.card}>
                                    {summary.lines.map((line) => (
                                        <View key={line.label} style={styles.change}>
                                            <ThemedText type="defaultSemiBold">{line.label}</ThemedText>
                                            <ThemedText type="muted" style={styles.fromTo}>{`Now: ${line.from}`}</ThemedText>
                                            <ThemedText style={styles.fromTo}>{`After: ${line.to}`}</ThemedText>
                                        </View>
                                    ))}
                                </Card>
                                <Card style={styles.card}>
                                    {summary.rulesChanged && strategy.active && (
                                        <>
                                            <ThemedText style={styles.note}>
                                                {"The new rules apply from the next candle. A position you hold now stays open and is judged by the new rules."}
                                            </ThemedText>
                                            <ThemedText style={styles.note}>
                                                {"Changing the rules starts this strategy's leaderboard results again from now: its 14 days and 3 trades count from the change. Its history and returns on this screen are kept."}
                                            </ThemedText>
                                        </>
                                    )}
                                    {summary.rulesChanged && !strategy.active && (
                                        <ThemedText style={styles.note}>
                                            {"This is a draft, so nothing is tracked yet. Your changes apply when you start it."}
                                        </ThemedText>
                                    )}
                                    {!summary.rulesChanged && (
                                        <ThemedText style={styles.note}>{"Only the name changes. The rules and the leaderboard are not affected."}</ThemedText>
                                    )}
                                    <ThemedText type="muted" style={styles.note}>Editing does not cost credits.</ThemedText>
                                </Card>
                                <GeneralButton title="Save changes" onPress={save} autoWidth={false} />
                                <GeneralButton title="Keep editing" variant="secondary" onPress={() => setReviewing(false)} autoWidth={false} />
                            </ScrollView>
                            :
                            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
                                automaticallyAdjustKeyboardInsets={true}>
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                                    <View style={styles.form}>
                                        <Card style={styles.card}>
                                            <TextField
                                                label="Name"
                                                value={title}
                                                onChangeText={setTitle}
                                                maxLength={MAX_TITLE_LENGTH}
                                                returnKeyType="done"
                                                onSubmitEditing={Keyboard.dismiss}
                                            />
                                            <View style={styles.market}>
                                                <ThemedText type="muted" style={styles.fromTo}>Market and candle interval</ThemedText>
                                                <ThemedText type="defaultSemiBold">{`${strategy.symbol} · ${strategy.interval}`}</ThemedText>
                                                <ThemedText type="muted" style={styles.small}>
                                                    These cannot be changed. For a different market or interval, start a new strategy.
                                                </ThemedText>
                                            </View>
                                        </Card>

                                        <IndicatorSection
                                            sectionTitle="Buy signals"
                                            tone="gain"
                                            signals={buySignals}
                                            setSignals={changeBuy}
                                            buttonText="Add buy indicator"
                                            buttonAction={() => setBuySignals([...buySignals, newSignal(true)])}
                                            setIndicatorIndex={setBuyIndex}
                                        />
                                        <IndicatorSection
                                            sectionTitle="Sell signals"
                                            tone="loss"
                                            signals={sellSignals}
                                            setSignals={setSellSignals}
                                            buttonText="Add sell indicator"
                                            buttonAction={() => setSellSignals([...sellSignals, newSignal(false)])}
                                            setIndicatorIndex={setSellIndex}
                                        />

                                        <ExitRulesSection inputs={exitInputs} setInputs={setExitInputs} />

                                        <GeneralButton title="Review changes" onPress={review} autoWidth={false} />
                                        <ThemedText type="muted" style={styles.small}>
                                            You will see what changes before anything is saved.
                                        </ThemedText>
                                    </View>
                                </TouchableWithoutFeedback>
                            </ScrollView>
            }
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },

    form: {
        gap: Spacing.xl,
    },

    card: {
        gap: Spacing.lg,
    },

    sectionTitle: {
        ...Type.subtitle,
    },

    market: {
        gap: Spacing.xs,
    },

    change: {
        gap: 2,
    },

    fromTo: {
        fontSize: 15,
    },

    note: {
        fontSize: 15,
        lineHeight: 22,
    },

    small: {
        fontSize: 13,
    },
});
