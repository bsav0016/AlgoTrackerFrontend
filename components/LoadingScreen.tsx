import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Spacing, useTheme } from '@/constants/Theme';

interface LoadingScreenProps {
    loadingMessage: string | null
}

export function LoadingScreen({ loadingMessage }: LoadingScreenProps) {
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
        <ThemedView style={styles.loadingScreen}>
            <Animated.View
                accessibilityRole="progressbar"
                style={[
                    styles.spinner,
                    { borderColor: theme.border, borderTopColor: theme.primary, transform: [{ rotate: spin }] },
                ]}
            />

            { loadingMessage &&
                <ThemedText type="muted">{loadingMessage}</ThemedText>
            }
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    loadingScreen: {
        position: 'absolute',
        zIndex: 99999,
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.lg,
    },

    spinner: {
        width: 64,
        height: 64,
        borderWidth: 7,
        borderRadius: 50,
    },
});
