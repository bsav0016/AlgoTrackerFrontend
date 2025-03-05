import { CustomHeaderView } from "@/components/CustomHeaderView";
import { Interval } from "@/features/strategy/enums/Interval";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { useEffect, useState } from 'react';
import { Signal } from "@/features/strategy/classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { defaultParams, Indicator } from "@/features/strategy/enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useLocalSearchParams } from "expo-router";
import { DateInput } from "@/features/strategy/components/dateInput";
import { IntervalModal } from "@/features/strategy/components/intervalModal";
import { IndicatorSection } from "@/features/strategy/components/indicatorSection";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Backtest } from "@/features/strategy/classes/Backtest";
import { Strategy } from "@/features/strategy/classes/Strategy";
import { useAuth } from "@/contexts/AuthContext";
import { StrategyService } from "@/features/strategy/StrategyService";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "./Routes";


export default function StrategySelectionScreen() {
    const { strategyType } = useLocalSearchParams(); 
    const { tokenRef } = useAuth();
    const { routeTo } = useRouteTo();
    
    const strategyTypeString = Array.isArray(strategyType) ? strategyType[0] : strategyType;
    const parsedStrategyType = Object.values(StrategyType).includes(strategyTypeString as StrategyType)
        ? (strategyTypeString as StrategyType)
        : undefined;

    const textInputColor = useThemeColor({}, 'text');
    
    const [symbol, setSymbol] = useState<string>('');
    const [interval, setInterval] = useState<Interval>(Interval.D1);
    const [buySignals, setBuySignals] = useState<Signal[]>([]);
    const [sellSignals, setSellSignals] = useState<Signal[]>([]);
    const [intervalModal, setIntervalModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [startDateMonth, setStartDateMonth] = useState<string>('');
    const [startDateDay, setStartDateDay] = useState<string>('');
    const [startDateYear, setStartDateYear] = useState<string>('');
    const [endDateMonth, setEndDateMonth] = useState<string>('');
    const [endDateDay, setEndDateDay] = useState<string>('');
    const [endDateYear, setEndDateYear] = useState<string>('');

    useEffect(() => {
        if (buySignals.length === 0) {
            addBuyIndicator();
        }
        if (sellSignals.length === 0) {
            addSellIndicator();
        }
    }, []);

    const addBuyIndicator = () => {
        const additionalIndicator = Indicator.RSI;
        const additionalBuySignal = new Signal(
            additionalIndicator, 
            50, 
            true,
            14,
            null,
            null,
            null
        );
        const prevBuySignals = [...buySignals]
        prevBuySignals.push(additionalBuySignal);
        setBuySignals(prevBuySignals);
    }

    const addSellIndicator = () => {
        const additionalIndicator = Indicator.RSI;
        const additionalSellSignal = new Signal(
            additionalIndicator, 
            50, 
            false,
            14,
            null,
            null,
            null
        );
        const prevSellSignals = [...sellSignals]
        prevSellSignals.push(additionalSellSignal);
        setSellSignals(prevSellSignals);
    }

    const clickedNext = () => {
        if (parsedStrategyType === StrategyType.Backtest) {
            clickedRunBacktest();
        } else {
            clickedSubscribeStrategy();
        }
    }

    const runBacktest = async (startDate: Date, endDate: Date) => {
        setLoading(true);
        setLoadingMessage("Conducting backtest...");
        try {
            if (!startDate || !endDate) {
                throw new Error("Start date or end date not set");
            }
            const strategy = new Strategy(
                -1,
                symbol,
                interval,
                buySignals,
                sellSignals,
                [],
                0
            );
            const backtest = new Backtest(
                strategy,
                startDate,
                endDate,
                [],
                {},
                []
            );
            if (!tokenRef.current) {
                throw new Error("Token not stored");
            }
            const backtestResult = await StrategyService.conductBacktest(backtest, tokenRef.current);
            routeTo(Routes.BacktestResults, { backtest: backtestResult.toNavigationJSON() });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMessage(null)
        }
    }    

    const clickedRunBacktest = () => {
        try {
            const startYear = parseInt(startDateYear);
            const endYear = parseInt(endDateYear);
            const startMonth = parseInt(startDateMonth);
            const endMonth = parseInt(endDateMonth);
            const startDay = parseInt(startDateDay);
            const endDay = parseInt(endDateDay);

            const startDate = new Date(startYear, startMonth - 1, startDay);
            const endDate = new Date(endYear, endMonth - 1, endDay);
            const currentDate = new Date();

            if (startDate > endDate) {
                throw new Error('Start date must come before end date');
            } else if (endDate > currentDate) {
                throw new Error('End date cannot be ahead of the current date');
            }

            runBacktest(startDate, endDate);
        } catch (error: any) {
            console.error(error);
        }
    }

    const clickedSubscribeStrategy = async () => {
        try {
            const strategy = new Strategy(
                -1,
                symbol,
                interval,
                buySignals,
                sellSignals,
                [],
                0
            );
            if (!tokenRef.current) {
                throw new Error("Token not stored");
            }
            const subscriptionResult = await StrategyService.subscribeStrategy(strategy, tokenRef.current);
            console.log(subscriptionResult)
        } catch (error: any) {
            console.error(error)
        }
    }

    return (
        <CustomHeaderView header="Build Your Strategy">
            {loading ? 
            <LoadingScreen loadingMessage={loadingMessage} />
            :
            <ThemedView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: 1 }}
                        >                        
                            <ThemedView style={styles.strategyView}>
                                <ThemedView style={styles.symbolContainer}>
                                    <ThemedText>Symbol:</ThemedText>
                                    <TextInput
                                        style={[styles.input, { color: textInputColor }]}
                                        returnKeyType="done"
                                        value={symbol}
                                        onChangeText={setSymbol}
                                    />
                                </ThemedView>
                                    

                                <ThemedView style={styles.symbolContainer}>
                                    <ThemedText>Candle Interval:</ThemedText>
                                    <TouchableOpacity style={[styles.dropdown, {flexDirection: 'row'}]} onPress={() => setIntervalModal(true)}>
                                        <ThemedText>{interval}</ThemedText>
                                        <ThemedText>▼</ThemedText>
                                    </TouchableOpacity>
                                </ThemedView>

                                <IntervalModal setIntervalLength={setInterval} intervalModal={intervalModal} setIntervalModal={setIntervalModal}/>

                                <IndicatorSection
                                    sectionTitle="Buy Signal(s)"
                                    signals={buySignals}
                                    setSignals={setBuySignals}
                                    buttonText="Add Buy Indicator"
                                    buttonAction={addBuyIndicator}
                                />
                                <IndicatorSection 
                                    sectionTitle="Sell Signal(s)"
                                    signals={sellSignals}
                                    setSignals={setSellSignals}
                                    buttonText="Add Sell Indicator"
                                    buttonAction={addSellIndicator}
                                />

                                { parsedStrategyType === StrategyType.Backtest &&
                                <>
                                    <DateInput
                                        startDateMonth={startDateMonth} setStartDateMonth={setStartDateMonth}
                                        startDateDay={startDateDay} setStartDateDay={setStartDateDay}
                                        startDateYear={startDateYear} setStartDateYear={setStartDateYear}
                                        endDateMonth={endDateMonth} setEndDateMonth={setEndDateMonth}
                                        endDateDay={endDateDay} setEndDateDay={setEndDateDay}
                                        endDateYear={endDateYear} setEndDateYear={setEndDateYear}
                                    />
                                </>}

                                <GeneralButton
                                    title={parsedStrategyType === StrategyType.Backtest ? "Run Backtest" : "Subscribe to Strategy"}
                                    onPress={clickedNext}
                                />
                                
                            </ThemedView> 

                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </ThemedView>
            }
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    strategyView: {
        flex: 1,
        flexDirection: 'column',
        gap: 15
    },

    symbolContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
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

    dropdown: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: 100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    dateInputContainer: {
        marginBottom: 10,
    },

    inputLabel: {
        fontSize: 14,
        color: '#555',
    },

    dateInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        width: 50,
        textAlign: 'center',
    },

    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
    },

    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    costNoteView: {
        width: '90%',
        alignSelf: 'center'
    }
})
