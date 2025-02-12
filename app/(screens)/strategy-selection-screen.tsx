import { CustomHeaderView } from "@/components/CustomHeaderView";
import { CandleLength } from "@/features/strategy/enums/CandleLength";
import { StrategyType } from "@/features/strategy/enums/StrategyType";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, Text, Switch, View } from "react-native";
import { useEffect, useState } from 'react';
import { Signal } from "@/features/strategy/classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Indicator } from "@/features/strategy/enums/Indicator";
import { GeneralButton } from "@/components/GeneralButton";
import { useLocalSearchParams } from "expo-router";
import { BacktestModal } from "@/features/strategy/components/backtestModal";
import { CandleModal } from "@/features/strategy/components/candleModal";
import { IndicatorSection } from "@/features/strategy/components/indicatorSection";


export default function StrategySelectionScreen() {
    const { strategyType } = useLocalSearchParams(); 
    
    const strategyTypeString = Array.isArray(strategyType) ? strategyType[0] : strategyType;
    const parsedStrategyType = Object.values(StrategyType).includes(strategyTypeString as StrategyType)
        ? (strategyTypeString as StrategyType)
        : undefined;

    const textInputColor = useThemeColor({}, 'text');
    
    const [symbol, setSymbol] = useState<string>('');
    const [initialInvestment, setInitialInvestment] = useState<string>();
    const [candleLength, setCandleLength] = useState<CandleLength>(CandleLength.D1);
    const [buySignals, setBuySignals] = useState<Signal[]>([]);
    const [sellSignals, setSellSignals] = useState<Signal[]>([]);
    const [candleModal, setCandleModal] = useState<boolean>(false);
    const [backtestModal, setBacktestModal] = useState<boolean>(false);
    const [subscriptionModal, setSubscriptionModal] = useState<boolean>(false);

    useEffect(() => {
        if (buySignals.length === 0) {
            addBuyIndicator();
        }
        if (sellSignals.length === 0) {
            addSellIndicator();
        }
    }, []);

    const addBuyIndicator = () => {
        const additionalBuySignal = new Signal(Indicator.RSI, 50, true);
        const prevBuySignals = [...buySignals]
        prevBuySignals.push(additionalBuySignal);
        setBuySignals(prevBuySignals);
    }

    const addSellIndicator = () => {
        const additionalSellSignal = new Signal(Indicator.RSI, 50, false);
        const prevSellSignals = [...sellSignals]
        prevSellSignals.push(additionalSellSignal);
        setSellSignals(prevSellSignals);
    }

    const clickedNext = () => {
        if (parsedStrategyType === StrategyType.Backtest) {
            setBacktestModal(true);
        } else {
            setSubscriptionModal(true);
        }
    }

    const runBacktest = () => {
        console.log("Run backtest");
        setBacktestModal(false);
    }    

    return (
        <CustomHeaderView header="Build Your Strategy">
            <ThemedView style={{ flex: 1 }}>
                <ScrollView>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: 1 }}
                        >                        
                            <ThemedView style={styles.strategyView}>
                                <ThemedView style={styles.firstContainer}>
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
                                        <ThemedText>Start Val:</ThemedText>
                                        <TextInput
                                            style={[styles.input, { color: textInputColor }]}
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                            value={initialInvestment}
                                            onChangeText={setInitialInvestment}
                                        />
                                    </ThemedView>
                                    
                                </ThemedView>

                                <ThemedView style={styles.symbolContainer}>
                                    <ThemedText>Candle Length:</ThemedText>
                                    <TouchableOpacity style={[styles.dropdown, {flexDirection: 'row'}]} onPress={() => setCandleModal(true)}>
                                        <ThemedText>{candleLength}</ThemedText>
                                        <ThemedText>▼</ThemedText>
                                    </TouchableOpacity>
                                </ThemedView>

                                <CandleModal setCandleLength={setCandleLength} candleModal={candleModal} setCandleModal={setCandleModal}/>

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

                                <View>
                                    <GeneralButton
                                        title={parsedStrategyType === StrategyType.Backtest ? "Set Date Parameters" : "Subscribe to Strategy"}
                                        onPress={clickedNext}
                                    />
                                </View>
                                
                            </ThemedView> 

                            <BacktestModal backtestModal={backtestModal} setBacktestModal={setBacktestModal} runBacktest={runBacktest}/>  

                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    strategyView: {
        flex: 1,
        flexDirection: 'column',
        gap: 15
    },

    firstContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
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
})
