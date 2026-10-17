import { OptionModal } from "@/components/OptionModal";
import { Interval } from "../dtos/SymbolsAndIntervalsResponseDTO";


interface IntervalModalProps {
    availableIntervals: Interval[];
    setIntervalLength: (interval: Interval) => void;
    intervalModal: boolean;
    setIntervalModal: (value: boolean) => void;
    selectedInterval?: string;
}

export function IntervalModal({ availableIntervals, setIntervalLength, intervalModal, setIntervalModal, selectedInterval }: IntervalModalProps) {
    return (
        <OptionModal
            visible={intervalModal}
            title="Candle interval"
            options={availableIntervals.map((interval) => ({ key: interval.interval, label: interval.interval }))}
            selectedKey={selectedInterval}
            onSelect={(key) => {
                const interval = availableIntervals.find((i) => i.interval === key);
                if (interval) {
                    setIntervalLength(interval);
                }
            }}
            onClose={() => setIntervalModal(false)}
        />
    )
}
