import { ThemedText } from "@/components/ThemedText";
import { Radius, Spacing, MIN_TOUCH, useTheme } from "@/constants/Theme";
import { useState, useRef } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";

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
    const theme = useTheme();
    const inputTheme = { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border };

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
        <View>
            {/* Start Date */}
            <View style={styles.dateInputContainer}>
                <ThemedText style={styles.rowLabel}>Start</ThemedText>
                <View style={styles.dateInputsRow}>
                    <TextInput
                        style={[styles.dateInput, inputTheme]}
                        value={startDateMonth}
                        onChangeText={handleStartDateMonthChange}
                        maxLength={2}
                        placeholder="MM"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={startMonthRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(startMonthString)}
                        onBlur={handleBlur}
                    />
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
                    <TextInput
                        style={[styles.dateInput, inputTheme]}
                        value={startDateDay}
                        onChangeText={handleStartDateDayChange}
                        maxLength={2}
                        placeholder="DD"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={startDayRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(startDayString)}
                        onBlur={handleBlur}
                    />
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
                    <TextInput
                        style={[styles.dateInput, { ...inputTheme, width: 70 }]}
                        value={startDateYear}
                        onChangeText={handleStartDateYearChange}
                        maxLength={4}
                        placeholder="YYYY"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={startYearRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(startYearString)}
                        onBlur={handleBlur}
                    />
                </View>
            </View>

            {/* End Date */}
            <View style={styles.dateInputContainer}>
                <ThemedText style={styles.rowLabel}>End</ThemedText>
                <View style={styles.dateInputsRow}>
                    <TextInput
                        style={[styles.dateInput, inputTheme]}
                        value={endDateMonth}
                        onChangeText={handleEndDateMonthChange}
                        maxLength={2}
                        placeholder="MM"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={endMonthRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(endMonthString)}
                        onBlur={handleBlur}
                    />
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
                    <TextInput
                        style={[styles.dateInput, inputTheme]}
                        value={endDateDay}
                        onChangeText={handleEndDateDayChange}
                        maxLength={2}
                        placeholder="DD"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={endDayRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(endDayString)}
                        onBlur={handleBlur}
                    />
                    <ThemedText style={styles.inputLabel}>/</ThemedText>
                    <TextInput
                        style={[styles.dateInput, { ...inputTheme, width: 70 }]}
                        value={endDateYear}
                        onChangeText={handleEndDateYearChange}
                        maxLength={4}
                        placeholder="YYYY"
                        keyboardType="numeric"
                        placeholderTextColor={theme.mutedText}
                        ref={endYearRef}
                        onKeyPress={handleBackspace}
                        onFocus={() => handleFocus(endYearString)}
                        onBlur={handleBlur}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    dateInputContainer: {
        marginBottom: Spacing.sm,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%'
    },

    rowLabel: {
        width: 48,
        fontWeight: '600'
    },

    inputLabel: {
        fontSize: 16
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
        minHeight: MIN_TOUCH,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.sm,
        fontSize: 16,
        width: 50,
        textAlign: 'center',
    },

});
