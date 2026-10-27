import { CustomHeaderView } from "@/components/CustomHeaderView";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { useEffect, useState } from 'react';
import { Signal } from "@/features/strategy/classes/Signal";
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
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { SelectField } from "@/components/SelectField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Spacing, Type } from "@/constants/Theme";
import { EditIndicator } from "@/features/strategy/components/editIndicator";
import { Interval } from "@/features/strategy/dtos/SymbolsAndIntervalsResponseDTO";
import { useUser } from "@/contexts/UserContext";


// A new signal with the default settings: the first indicator, target 50, a 14-period window.
const newSignal = (aboveTarget: boolean) => new Signal(indicators[0], 50, aboveTarget, 14, null, null, null);

export default function StrategySelectionScreen() {
    const { strategyType } = useLocalSearchParams(); 
    const { accessToken } = useAuth();
    const { updateAccountCredits } = useUser();
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();
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
    const [buySignals, setBuySignals] = useState<Signal[]>(() => [newSignal(true)]);
    const [sellSignals, setSellSignals] = useState<Signal[]>(() => [newSignal(false)]);
    // The lists always hold at least one signal: removing the last one puts a fresh default in its place.
    const changeBuySignals = (next: Signal[]) => setBuySignals(next.length > 0 ? next : [newSignal(true)]);
    const changeSellSignals = (next: Signal[]) => setSellSignals(next.length > 0 ? next : [newSignal(false)]);
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
        if (backtestData) {
            routeTo(Routes.BacktestResults);
        }
    }, [backtestData]);

    const addBuyIndicator = () => {
        setBuySignals([...buySignals, newSignal(true)]);
    }

    const addSellIndicator = () => {
        setSellSignals([...sellSignals, newSignal(false)]);
    }

    const clickedNext = () => {
        let message: string;
        let callbackFunction;

        if (functionType === StrategyType.Backtest) {
            message = `Backtest will cost ${backtestBaseCost}-${backtestBaseCost * backtestIterations} credits (${backtestBaseCost} for every 5000 data points queried)`;
            callbackFunction = clickedRunBacktest
        } else {
            message = `Strategy will charge ${interval?.monthly_charge || 1} credits per month until stopped or insufficient credits`
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
            updateAccountCredits(returnedBacktest.userAccountCredits, returnedBacktest.userMonthlyCredits);
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
            await StrategyService.subscribeStrategy(strategy, accessToken);
            addToast("Subscribed successfully");
            routeBack();
        } catch (error: any) {
            console.error(error);
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

    const formatCredits = (value: number) => `${+value.toFixed(2)}`;
    const costNote = functionType === StrategyType.Backtest
        ? `Costs ${formatCredits(backtestBaseCost)} credits per 5,000 data points queried, up to ${formatCredits(backtestBaseCost * backtestIterations)}.`
        : `Costs ${interval?.monthly_charge ?? 1} credits per month until stopped or credits run out.`;

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
                setSignals={changeBuySignals}
                indicatorIndex={buyIndicatorIndex}
                setIndicatorIndex={setBuyIndicatorIndex}
            />
            : sellIndicatorIndex !== null ?
            <EditIndicator
                signals={sellSignals}
                setSignals={changeSellSignals}
                indicatorIndex={sellIndicatorIndex}
                setIndicatorIndex={setSellIndicatorIndex}
            />
            :
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={true}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.form}>
                        <SegmentedControl
                            options={[
                                { value: StrategyType.Backtest, label: "Backtest" },
                                { value: StrategyType.Subscription, label: "Subscribe" },
                            ]}
                            value={functionType}
                            onChange={setFunctionType}
                        />

                        <Card style={styles.marketCard}>
                            {functionType === StrategyType.Subscription &&
                                <TextField
                                    label="Title"
                                    placeholder="Name your strategy"
                                    returnKeyType="done"
                                    value={title}
                                    onChangeText={setTitle}
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                            }

                            <View style={styles.row}>
                                <View style={styles.rowItem}>
                                    <SelectField label="Symbol" value={symbol} onPress={() => setSymbolModal(true)} />
                                </View>
                                <View style={styles.rowItem}>
                                    <SelectField label="Candle interval" value={interval?.interval} onPress={() => setIntervalModal(true)} />
                                </View>
                            </View>
                        </Card>

                        <SymbolModal
                            availableSymbols={availableSymbols}
                            setSymbol={setSymbol}
                            symbolModal={symbolModal}
                            setSymbolModal={setSymbolModal}
                            selectedSymbol={symbol}
                        />

                        <IntervalModal
                            availableIntervals={availableIntervals}
                            setIntervalLength={setInterval}
                            intervalModal={intervalModal}
                            setIntervalModal={setIntervalModal}
                            selectedInterval={interval?.interval}
                        />

                        <IndicatorSection
                            sectionTitle="Buy signals"
                            tone="gain"
                            signals={buySignals}
                            setSignals={changeBuySignals}
                            buttonText="Add buy indicator"
                            buttonAction={addBuyIndicator}
                            setIndicatorIndex={setBuyIndicatorIndex}
                        />

                        <IndicatorSection
                            sectionTitle="Sell signals"
                            tone="loss"
                            signals={sellSignals}
                            setSignals={changeSellSignals}
                            buttonText="Add sell indicator"
                            buttonAction={addSellIndicator}
                            setIndicatorIndex={setSellIndicatorIndex}
                        />

                        {functionType === StrategyType.Backtest &&
                            <View style={styles.dateSection}>
                                <ThemedText style={styles.sectionTitle}>Date range</ThemedText>
                                <Card>
                                    <DateInput
                                        startDateMonth={startDateMonth} setStartDateMonth={setStartDateMonth}
                                        startDateDay={startDateDay} setStartDateDay={setStartDateDay}
                                        startDateYear={startDateYear} setStartDateYear={setStartDateYear}
                                        endDateMonth={endDateMonth} setEndDateMonth={setEndDateMonth}
                                        endDateDay={endDateDay} setEndDateDay={setEndDateDay}
                                        endDateYear={endDateYear} setEndDateYear={setEndDateYear}
                                    />
                                </Card>
                            </View>
                        }

                        <View style={styles.cta}>
                            <ThemedText type="muted" style={styles.costNote}>{costNote}</ThemedText>
                            <GeneralButton
                                title={functionType === StrategyType.Backtest ? "Run Backtest" : "Subscribe to Strategy"}
                                onPress={clickedNext}
                                autoWidth={false}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
            }
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
    },

    form: {
        gap: Spacing.xl,
    },

    marketCard: {
        gap: Spacing.lg,
    },

    row: {
        flexDirection: 'row',
        gap: Spacing.md,
    },

    rowItem: {
        flex: 1,
    },

    sectionTitle: {
        ...Type.subtitle,
    },

    dateSection: {
        gap: Spacing.sm,
    },

    cta: {
        gap: Spacing.sm,
    },

    costNote: {
        fontSize: 14,
        textAlign: 'center',
    },
})
