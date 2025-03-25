import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState, useRef } from "react";
import { Keyboard, StyleSheet, TextInput } from "react-native";

interface DateInputProps {
    startDateMonth: string;
    startDateDay: string;
    startDateYear: string;
    endDateMonth: string;
    endDateDay: string;
    endDateYear: string;
    setStartDateMonth: (startDateMonth: string) => void;
    setStartDateDay: (startDateDay: string) => void;
    setStartDateYear: (startDateYear: string) => void;
    setEndDateMonth: (endDateMonth: string) => void;
    setEndDateDay: (endDateDay: string) => void;
    setEndDateYear: (endDateYear: string) => void;
}

export function DateInput({
    startDateMonth,
    startDateDay,
    startDateYear,
    endDateMonth,
    endDateDay,
    endDateYear,
    setStartDateMonth,
    setStartDateDay,
    setStartDateYear,
    setEndDateMonth,
    setEndDateDay,
    setEndDateYear
}: DateInputProps) {
    const textInputColor = useThemeColor({}, 'text');

    const [focusedInput, setFocusedInput] = useState<string>('');

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

    return (
        <ThemedView>
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
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
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
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
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
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
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
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    dateInputContainer: {
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        width: '90%'
    },

    inputLabel: {
        fontSize: 20
    },

    dateInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 3,
        flex: 1
    },

    dateInput: {
        flex: 1,
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
