import { OptionModal } from "@/components/OptionModal";

interface SymbolModalProps {
    availableSymbols: string[];
    setSymbol: (symbol: string) => void;
    symbolModal: boolean;
    setSymbolModal: (value: boolean) => void;
    selectedSymbol?: string;
}

export function SymbolModal({ availableSymbols, setSymbol, symbolModal, setSymbolModal, selectedSymbol }: SymbolModalProps) {
    return (
        <OptionModal
            visible={symbolModal}
            title="Symbol"
            options={availableSymbols.map((symbol) => ({ key: symbol, label: symbol }))}
            selectedKey={selectedSymbol}
            onSelect={setSymbol}
            onClose={() => setSymbolModal(false)}
        />
    )
}
