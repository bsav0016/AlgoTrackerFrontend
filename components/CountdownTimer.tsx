import React, { useEffect, useState } from 'react';
import { ThemedText } from './ThemedText';
import { formatTime } from '@/lib/TimeFormatUtil';

interface CountdownTimerProps {
    timeRemaining: number;
    alignRight?: boolean;
    whenZero?: (() => Promise<void>) | null
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
    timeRemaining, 
    alignRight=false, 
    whenZero=null
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    if (whenZero !== null) {
                        whenZero();
                    }
                    clearInterval(interval);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    return (
        <ThemedText style={[alignRight && { textAlign: 'right' }]}>
            {formatTime(timeLeft)}
        </ThemedText>
    );
};
