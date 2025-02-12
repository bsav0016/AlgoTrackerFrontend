import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUser } from "@/contexts/UserContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState, useRef } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, TouchableOpacity } from "react-native";

interface BacktestModalProps {
    backtestModal: boolean;
    setBacktestModal: (value: boolean) => void;
    runBacktest: () => void;
}

export function BacktestModal({ backtestModal, setBacktestModal, runBacktest }: BacktestModalProps) {
    const { userRef } = useUser();
    const textInputColor = useThemeColor({}, 'text');

    const [startDateMonth, setStartDateMonth] = useState<string>('');
    const [startDateDay, setStartDateDay] = useState<string>('');
    const [startDateYear, setStartDateYear] = useState<string>('');
    const [endDateMonth, setEndDateMonth] = useState<string>('');
    const [endDateDay, setEndDateDay] = useState<string>('');
    const [endDateYear, setEndDateYear] = useState<string>('');
    const [focusedInput, setFocusedInput] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const startMonthString = "startMonth";
    const startDayString = "startDay";
    const startYearString = "startYear";
    const endMonthString = "endMonth";
    const endDayString = "endYear";
    const endYearString = "endYear";

    const startMonthRef = useRef<TextInput>(null);
    const startDayRef = useRef<TextInput>(null);
    const startYearRef = useRef<TextInput>(null);

    const endMonthRef = useRef<TextInput>(null);
    const endDayRef = useRef<TextInput>(null);
    const endYearRef = useRef<TextInput>(null);

    const formatDate = (text: string) => {
        return text.replace(/[^0-9]/g, '');
    };

    const handleStartDateMonthChange = (text: string) => {
        const formatted = formatDate(text);
        setStartDateMonth(formatted);
        if (formatted.length === 2) {
            startDayRef.current?.focus();
        } else {
            try {
                const number = parseInt(text);
                if (number > 1) {
                    startDayRef.current?.focus();
                }
            } catch {
                return;
            }
        }
    };

    const handleStartDateDayChange = (text: string) => {
        const formatted = formatDate(text);
        setStartDateDay(formatted);
        if (formatted.length === 2) {
            startYearRef.current?.focus();
        } else {
            try {
                const number = parseInt(text);
                if (number > 3) {
                    startYearRef.current?.focus();
                }
            } catch {
                return;
            }
        }
    };

    const handleStartDateYearChange = (text: string) => {
        const formatted = formatDate(text);
        setStartDateYear(formatted);
        if (formatted.length === 4) {
            endMonthRef.current?.focus();
        }
    };

    const handleEndDateMonthChange = (text: string) => {
        const formatted = formatDate(text);
        setEndDateMonth(formatted);
        if (formatted.length === 2) {
            endDayRef.current?.focus();
        } else {
            try {
                const number = parseInt(text);
                if (number > 1) {
                    endDayRef.current?.focus();
                }
            } catch {
                return;
            }
        }
    };

    const handleEndDateDayChange = (text: string) => {
        const formatted = formatDate(text);
        setEndDateDay(formatted);
        if (formatted.length === 2) {
            endYearRef.current?.focus();
        } else {
            try {
                const number = parseInt(text);
                if (number > 3) {
                    endYearRef.current?.focus();
                }
            } catch {
                return;
            }
        }
    };

    const handleEndDateYearChange = (text: string) => {
        const formatted = formatDate(text);
        setEndDateYear(formatted);
        if (formatted.length === 4) {
            Keyboard.dismiss();
        }
    };

    const handleBackspace = (e: any) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (focusedInput === startDayString && startDateDay.length === 0) {
                startMonthRef.current?.focus();
            }
            else if (focusedInput === startYearString && startDateYear.length === 0) {
                startDayRef.current?.focus();
            }

            else if (focusedInput === endMonthString && endDateMonth.length === 0) {
                startYearRef.current?.focus();
            } else if (focusedInput === endDayString && endDateDay.length === 0) {
                endMonthRef.current?.focus();
            }
            else if (focusedInput === endYearString && endDateYear.length === 0) {
                endDayRef.current?.focus();
            }
        }
    };

    const handleFocus = (input: string) => {
        setFocusedInput(input);
    };
    
    const handleBlur = () => {
        setFocusedInput('');
    };

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

            runBacktest();
        } catch (error: any) {
            if (error.message) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('Please ensure the dates are formatted MM/DD/YYYY');
            }
        }
    }

    return (
        <Modal
            visible={backtestModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setBacktestModal(false)}
        >
            <ThemedView style={styles.modalOverlay}>
                { errorMessage ?
                    <ThemedView style={styles.modalContainer}>
                        <ThemedText style={{textAlign: 'center'}}>{errorMessage}</ThemedText>
                        <GeneralButton title="Dismiss" onPress={() => setErrorMessage(null)} />
                    </ThemedView>
                    :
                    <ThemedView style={styles.modalContainer}>
                        <ThemedText style={styles.modalTitle}>Set Backtest Date Range</ThemedText>

                        {/* Start Date */}
                        <ThemedView style={styles.dateInputContainer}>
                            <ThemedText style={styles.inputLabel}>Start Date:</ThemedText>
                            <ThemedView style={styles.dateInputsRow}>
                                <TextInput
                                    style={[styles.dateInput, { color: textInputColor }]}
                                    value={startDateMonth}
                                    onChangeText={handleStartDateMonthChange}
                                    maxLength={2}
                                    placeholder="MM"
                                    keyboardType="numeric"
                                    ref={startMonthRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(startMonthString)}
                                    onBlur={handleBlur}
                                />
                                <TextInput
                                    style={[styles.dateInput, { color: textInputColor }]}
                                    value={startDateDay}
                                    onChangeText={handleStartDateDayChange}
                                    maxLength={2}
                                    placeholder="DD"
                                    keyboardType="numeric"
                                    ref={startDayRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(startDayString)}
                                    onBlur={handleBlur}
                                />
                                <TextInput
                                    style={[styles.dateInput, { width: 70, color: textInputColor }]}
                                    value={startDateYear}
                                    onChangeText={handleStartDateYearChange}
                                    maxLength={4}
                                    placeholder="YYYY"
                                    keyboardType="numeric"
                                    ref={startYearRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(startYearString)}
                                    onBlur={handleBlur}
                                />
                            </ThemedView>
                        </ThemedView>

                        {/* End Date */}
                        <ThemedView style={styles.dateInputContainer}>
                            <ThemedText style={styles.inputLabel}>End Date:</ThemedText>
                            <ThemedView style={styles.dateInputsRow}>
                                <TextInput
                                    style={[styles.dateInput, { color: textInputColor }]}
                                    value={endDateMonth}
                                    onChangeText={handleEndDateMonthChange}
                                    maxLength={2}
                                    placeholder="MM"
                                    keyboardType="numeric"
                                    ref={endMonthRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(endMonthString)}
                                    onBlur={handleBlur}
                                />
                                <TextInput
                                    style={[styles.dateInput, { color: textInputColor }]}
                                    value={endDateDay}
                                    onChangeText={handleEndDateDayChange}
                                    maxLength={2}
                                    placeholder="DD"
                                    keyboardType="numeric"
                                    ref={endDayRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(endDayString)}
                                    onBlur={handleBlur}
                                />
                                <TextInput
                                    style={[styles.dateInput, { width: 70, color: textInputColor }]}
                                    value={endDateYear}
                                    onChangeText={handleEndDateYearChange}
                                    maxLength={4}
                                    placeholder="YYYY"
                                    keyboardType="numeric"
                                    ref={endYearRef}
                                    onKeyPress={handleBackspace}
                                    onFocus={() => handleFocus(endYearString)}
                                    onBlur={handleBlur}
                                />
                            </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.costNoteView}>
                            <ThemedText style={{textAlign: 'center'}}>
                                {`You have ${userRef.current?.freeBacktests || 0} free backtests remaining this month.`}
                            </ThemedText>
                            { !userRef.current?.freeBacktests &&
                                <ThemedText>Backtest cost: $0.10</ThemedText>
                            }
                        </ThemedView>

                        <TouchableOpacity style={styles.saveButton} onPress={clickedRunBacktest}>
                            <ThemedText style={styles.saveButtonText}>Run Backtest</ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                }
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingBottom: 80,
    },

    modalContainer: {
        padding: 20,
        borderRadius: 10,
        width: 250,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
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
});
