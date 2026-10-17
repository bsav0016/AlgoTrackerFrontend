import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/constants/Theme';

export function LoadingSpinner() {
    const [spinValue] = useState(new Animated.Value(0));
    const theme = useTheme();

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            accessibilityRole="progressbar"
            style={[
                styles.spinner,
                { borderColor: theme.border, borderTopColor: theme.primary, transform: [{ rotate: spin }] },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    spinner: {
        width: 50,
        height: 50,
        borderWidth: 6,
        borderRadius: 50,
    },
});
