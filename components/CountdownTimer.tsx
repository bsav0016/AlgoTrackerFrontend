import React, { useEffect, useRef, useState } from 'react';
import { ThemedText } from './ThemedText';
import { formatTime } from '@/lib/TimeFormatUtil';

interface CountdownTimerProps {
    // When the countdown ends. Give the component a `key` that changes with this date, so a new date starts a new count.
    endsAt: Date;
    alignRight?: boolean;
    whenZero?: (() => Promise<void>) | null
}

const secondsUntil = (endsAt: Date) => (endsAt.getTime() - Date.now()) / 1000;

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    endsAt,
    alignRight=false,
    whenZero=null
}) => {
    const [timeLeft, setTimeLeft] = useState(() => secondsUntil(endsAt));
    // The callback to run is the latest one given, not the one from the render that started the timer.
    const whenZeroRef = useRef(whenZero);
    useEffect(() => {
        whenZeroRef.current = whenZero;
    });

    const endMs = endsAt.getTime();
    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = (endMs - Date.now()) / 1000;
            if (remaining <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
                whenZeroRef.current?.();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endMs]);

    return (
        <ThemedText style={[alignRight && { textAlign: 'right' }]}>
            {formatTime(timeLeft)}
        </ThemedText>
    );
};
