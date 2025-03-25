import { ThemedText } from "@/components/ThemedText";
import { Signal } from "../classes/Signal";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet, TouchableOpacity } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

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
        if (signal.aboveTarget) {
            variables.push(`Above ${signal.targetValue}`);
        } else {
            variables.push(`Below ${signal.targetValue}`);
        }
        
        if (variables.length === 0) {
            return ""
        }
        let parameterString = "("
        for (let i = 0; i < variables.length - 1; i++) {
            parameterString += `${variables[i]}, `
        }
        parameterString += `${variables[variables.length - 1]})`
        return parameterString;
    }
    
    return (
        <ThemedView style={styles.indicatorSectionContainer}>
            <ThemedText style={styles.signalSectionHeader}>{sectionTitle}</ThemedText>
            {signals.map((signal, index) => (
                <ThemedView key={index} style={styles.signalContainer}>
                    <ThemedView style={styles.nameContainer}>
                        <ThemedText>{signal.indicator.name}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.parameterContainer}>
                        <ThemedText style={styles.parameterText}>{signalParameterString(signal)}</ThemedText>
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
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    indicatorSectionContainer: {
        gap: 5,
    },

    signalSectionHeader: {
        textAlign: 'center', 
        fontWeight: 700, 
        fontSize: 24,
        paddingTop: 0,
        marginTop: 0
    },

    signalContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: '90%'
    },

    nameContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    parameterContainer: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center'
    },

    parameterText: {
        textAlign: 'center'
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