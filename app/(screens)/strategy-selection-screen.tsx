import { CustomHeaderView } from "@/components/CustomHeaderView";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useEffect, useState } from 'react';
import { Signal } from "@/features/strategy/classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { indicators } from "@/features/strategy/enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DateInput } from "@/features/strategy/components/dateInput";
import { IntervalModal } from "@/features/strategy/components/intervalModal";
import { IndicatorSection } from "@/features/strategy/components/indicatorSection";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Backtest } from "@/features/strategy/classes/Backtest";
import { Strategy } from "@/features/strategy/classes/Strategy";
import { useAuth } from "@/contexts/AuthContext";
import { StrategyService } from "@/features/strategy/StrategyService";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { useToast } from "@/contexts/ToastContext";
import { SymbolModal } from "@/features/strategy/components/symbolModal";
import { useBacktest } from "@/contexts/BacktestContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { EditIndicator } from "@/features/strategy/components/editIndicator";
import { Interval } from "@/features/strategy/dtos/SymbolsAndIntervalsResponseDTO";
import { useUser } from "@/contexts/UserContext";


export default function StrategySelectionScreen() {
    const { strategyType } = useLocalSearchParams(); 
    const { accessToken } = useAuth();
    const { updateAccountFunds } = useUser();
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();
    const textInputColor = useThemeColor({}, 'text');
    const { backtestData, setBacktestData } = useBacktest();
    const router = useRouter();
    
    const strategyTypeString = Array.isArray(strategyType) ? strategyType[0] : strategyType;
    const parsedStrategyType = Object.values(StrategyType).includes(strategyTypeString as StrategyType)
        ? (strategyTypeString as StrategyType)
        : StrategyType.Backtest;
    
    const [functionType, setFunctionType] = useState<StrategyType>(parsedStrategyType);
    const [availableSymbols, setAvailableSymbols] = useState<string[]>(['']);
    const [availableIntervals, setAvailableIntervals] = useState<Interval[]>([]);
    const [backtestBaseCost, setBacktestBaseCost] = useState<number>(0.03);
    const [backtestIterations, setBacktestIterations] = useState<number>(5);
    const [title, setTitle] = useState<string>('');
    const [symbol, setSymbol] = useState<string>('');
    const [interval, setInterval] = useState<Interval>();
    const [symbolModal, setSymbolModal] = useState<boolean>(false);
    const [intervalModal, setIntervalModal] = useState<boolean>(false);
    const [buySignals, setBuySignals] = useState<Signal[]>([]);
    const [sellSignals, setSellSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [startDateMonth, setStartDateMonth] = useState<string>('');
    const [startDateDay, setStartDateDay] = useState<string>('');
    const [startDateYear, setStartDateYear] = useState<string>('');
    const [endDateMonth, setEndDateMonth] = useState<string>('');
    const [endDateDay, setEndDateDay] = useState<string>('');
    const [endDateYear, setEndDateYear] = useState<string>('');
    const [buyIndicatorIndex, setBuyIndicatorIndex] = useState<number | null>(null);
    const [sellIndicatorIndex, setSellIndicatorIndex] = useState<number | null>(null);

    useEffect(() => {
        const getSymbolsAndIntervals = async () => {
            if (accessToken) {
                try {
                    const symbolsAndIntervals = await StrategyService.getSymbolsAndIntervals(accessToken);
                    setAvailableSymbols(symbolsAndIntervals.symbols);
                    setAvailableIntervals(symbolsAndIntervals.intervals);
                    setBacktestBaseCost(symbolsAndIntervals.backtestBaseCost);
                    setBacktestIterations(symbolsAndIntervals.backtestIterations);
                } catch {
                    addToast("Communication with server failed");
                    routeTo(Routes.Home);
                }
            }
        }

        setBacktestData(null);
        getSymbolsAndIntervals();
    }, []);

    useEffect(() => {
        if (buySignals.length === 0) {
            addBuyIndicator();
        }
        if (sellSignals.length === 0) {
            addSellIndicator();
        }
    }, [buySignals, sellSignals]);

    useEffect(() => {
        if (backtestData) {
            routeTo(Routes.BacktestResults);
        }
    }, [backtestData]);

    const addBuyIndicator = () => {
        const additionalIndicator = indicators[0];
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
        const additionalIndicator = indicators[0];
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
        let message: string;
        let callbackFunction;

        if (functionType === StrategyType.Backtest) {
            message = `Backtest will cost $${backtestBaseCost}-$${backtestBaseCost * backtestIterations} ($${backtestBaseCost} for every 5000 data points queried)`;
            callbackFunction = clickedRunBacktest
        } else {
            message = `Strategy will cost $${interval?.monthly_charge || 1} per month until stopped or insufficient funds`
            callbackFunction = clickedSubscribeStrategy
        }

        message += ". The data provided here is strictly informational and is not financial advice."

        addToast(message, 
            [{
                label: 'Execute',
                callback: callbackFunction
            }]
        );
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
                '',
                symbol,
                interval?.interval || "",
                buySignals,
                sellSignals
            );
            const backtest = new Backtest(
                strategy,
                startDate,
                endDate
            );
            if (!accessToken) {
                throw new Error("Token not stored");
            }
            const returnedBacktest = await StrategyService.conductBacktest(backtest, accessToken);
            updateAccountFunds(returnedBacktest.userAccountFunds, returnedBacktest.userMonthlyFunds);
            setBacktestData(returnedBacktest.backtest);
        } catch (error: any) {
            if (error.status && error.status === 402) {
                addToast(error.message);
            } else {
                console.error(error);
            }
        } finally {
            setLoading(false);
            setLoadingMessage(null);
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
            addToast(error);
            console.error(error);
        }
    }

    const clickedSubscribeStrategy = async () => {
        if (title.length === 0) {
            addToast("Please add a title");
            return;
        }
        try {
            const strategy = new Strategy(
                -1,
                title,
                symbol,
                interval?.interval || "",
                buySignals,
                sellSignals
            );
            if (!accessToken) {
                throw new Error("Token not stored");
            }
            const subscriptionResult = await StrategyService.subscribeStrategy(strategy, accessToken);
        } catch (error: any) {
            console.error(error);
        }
    }

    const switchStrategyType = () => {
        if (functionType === StrategyType.Backtest) {
            setFunctionType(StrategyType.Subscription)
        } else {
            setFunctionType(StrategyType.Backtest);
        }
    }

    const routeBack = () => {
        if (buyIndicatorIndex !== null) {
            setBuyIndicatorIndex(null);
        }
        else if (sellIndicatorIndex !== null) {
            setSellIndicatorIndex(null);
        } else {
            router.back();
        }
    }

    function LineBreak() {
        return (
            <View style={{ borderBottomWidth: 1, borderColor: textInputColor, width: '100%'}} />
        );
    }

    return (
        <CustomHeaderView 
            header={`Build Your ${buyIndicatorIndex === null && sellIndicatorIndex === null ? 'Strategy' : 'Signal'}`}
            goBack={routeBack}
        >
            {loading ? 
            <LoadingScreen loadingMessage={loadingMessage} />
            : buyIndicatorIndex !== null ?
            <EditIndicator
                signals={buySignals}
                setSignals={setBuySignals}
                indicatorIndex={buyIndicatorIndex}
                setIndicatorIndex={setBuyIndicatorIndex}
            />
            : sellIndicatorIndex !== null ?
            <EditIndicator
                signals={sellSignals}
                setSignals={setSellSignals}
                indicatorIndex={sellIndicatorIndex}
                setIndicatorIndex={setSellIndicatorIndex}
            />
            :
            <ThemedView>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }} 
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    automaticallyAdjustContentInsets={false}
                    contentInsetAdjustmentBehavior="never"
                    maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 100 }}
                    automaticallyAdjustKeyboardInsets={true}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>                
                        <ThemedView style={styles.strategyView}>
                            <GeneralButton
                                title={`Convert to ${functionType === StrategyType.Backtest ? "Strategy" : "Backtest"}`}
                                onPress={switchStrategyType}
                            />

                            { functionType === StrategyType.Subscription &&
                                <ThemedView style={styles.symbolContainer}>
                                    <ThemedText>Title:</ThemedText>
                                    <TextInput
                                        style={[styles.input, { color: textInputColor }]}
                                        returnKeyType="done"
                                        value={title}
                                        onChangeText={setTitle}
                                        onSubmitEditing={Keyboard.dismiss}
                                    />
                                </ThemedView>
                            }

                            <ThemedView style={styles.symbolContainer}>
                                <ThemedText>Symbol:</ThemedText>
                                <TouchableOpacity style={[styles.dropdown, {flexDirection: 'row'}]} onPress={() => setSymbolModal(true)}>
                                    <ThemedText>{symbol}</ThemedText>
                                    <ThemedText>▼</ThemedText>
                                </TouchableOpacity>
                            </ThemedView>

                            <SymbolModal 
                                availableSymbols={availableSymbols}
                                setSymbol={setSymbol} 
                                symbolModal={symbolModal} 
                                setSymbolModal={setSymbolModal}
                            />                                    

                            <ThemedView style={styles.symbolContainer}>
                                <ThemedText>Candle Interval:</ThemedText>
                                <TouchableOpacity style={[styles.dropdown, {flexDirection: 'row'}]} onPress={() => setIntervalModal(true)}>
                                    <ThemedText>{interval?.interval || ""}</ThemedText>
                                    <ThemedText>▼</ThemedText>
                                </TouchableOpacity>
                            </ThemedView>

                            <LineBreak />

                            <IntervalModal 
                                availableIntervals={availableIntervals}
                                setIntervalLength={setInterval} 
                                intervalModal={intervalModal} 
                                setIntervalModal={setIntervalModal}
                            />

                            <IndicatorSection
                                sectionTitle="Buy Signal(s)"
                                signals={buySignals}
                                setSignals={setBuySignals}
                                buttonText="Add Buy Indicator"
                                buttonAction={addBuyIndicator}
                                setIndicatorIndex={setBuyIndicatorIndex}
                            />
                            <LineBreak />
                            <IndicatorSection 
                                sectionTitle="Sell Signal(s)"
                                signals={sellSignals}
                                setSignals={setSellSignals}
                                buttonText="Add Sell Indicator"
                                buttonAction={addSellIndicator}
                                setIndicatorIndex={setSellIndicatorIndex}
                            />
                            <LineBreak />

                            { functionType === StrategyType.Backtest &&
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
                                title={functionType === StrategyType.Backtest ? "Run Backtest" : "Subscribe to Strategy"}
                                onPress={clickedNext}
                            />
                            
                        </ThemedView> 
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
        gap: 15,
        alignItems: 'center'
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
