export interface SymbolsAndIntervalsResponseData {
    symbols: string[];
    intervals: string[];
}

export class SymbolsAndIntervalsResponseDTO {
    symbols: string[];
    intervals: string[];

    constructor(
        symbols: string[],
        intervals: string[]
    ) {
        this.symbols = symbols;
        this.intervals = intervals;
    }

    static fromData(data: SymbolsAndIntervalsResponseData) {
        return new SymbolsAndIntervalsResponseDTO(
            data.symbols,
            data.intervals
        );
    }
}