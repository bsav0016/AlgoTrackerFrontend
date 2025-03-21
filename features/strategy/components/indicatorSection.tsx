import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, TouchableOpacity } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from "@/constants/Colors";

interface SignalSectionProps {
    sectionTitle: string;
    signals: Signal[];
    setSignals: (signals: Signal[]) => void;
    buttonText: string;
    buttonAction: () => void;
    setIndicatorIndex: (index: number) => void;
}

export function IndicatorSection({
    sectionTitle,
    signals,
    setSignals,
    buttonText,
    buttonAction,
    setIndicatorIndex
}: SignalSectionProps) {  
    const deleteIndicator = (index: number) => {
        const newSignals: Signal[] = signals.filter((_, i) => i !== index);
        setSignals(newSignals);
    }

    const signalParameterString = (signal: Signal) => {
        let variables = []
        if (signal.window) {
            variables.push(signal.window);
        }
        if (signal.fastWindow) {
            variables.push(signal.fastWindow)
        }
        if (signal.slowWindow) {
            variables.push(signal.slowWindow);
        }
        if (signal.signalWindow) {
            variables.push(signal.signalWindow);
        }
        
        if (variables.length === 0) {
            return ""
        }
        let parameterString = "("
        for (let i = 0; i < variables.length - 2; i++) {
            parameterString += `${variables[i]}, `
        }
        parameterString += `${variables[variables.length - 1]})`
        return parameterString;
    }
    
    return (
        <>
            <ThemedText style={styles.signalSectionHeader}>{sectionTitle}</ThemedText>
            {signals.map((signal, index) => (
                <ThemedView key={index} style={styles.signalContainer}>
                    <ThemedView style={styles.nameContainer}>
                        <ThemedText>{signal.indicator.name}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.parameterContainer}>
                        <ThemedText>{signalParameterString(signal)}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.buttonsContainer}>
                        <TouchableOpacity onPress={() => deleteIndicator(index)}>
                            <FontAwesome name="trash" size={28} color="red" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIndicatorIndex(index)}>
                            <FontAwesome name="pencil-square-o" size={28} color={Colors.button.background} />
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
            ))}
            
            {signals.length < 3 &&
                <ThemedView style={{ alignItems: 'center' }}><GeneralButton title={buttonText} onPress={buttonAction}/></ThemedView>
            }
        </>
    )
}

const styles = StyleSheet.create({
    signalSectionHeader: {
        textAlign: 'center', 
        fontWeight: 700, 
        marginTop: 30, 
        fontSize: 24 
    },

    signalContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: '80%'
    },

    nameContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    parameterContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    buttonsContainer: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        gap: 20,
        alignItems: 'center',
        justifyContent: 'center'
    }
})