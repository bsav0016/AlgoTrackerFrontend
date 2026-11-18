import { formatPercent } from "./chart/chartMath";

/** The plain-language numbers the server works out for a backtest (see api/trade_stats.py). Percentages are after costs. */
export interface PlainNumbers {
    maxDrawdown: number | null; // the strategy's biggest fall from a high, zero or negative
    assetMaxDrawdown: number | null; // the same for just holding
    closedTrades: number | null;
    winningTrades: number | null;
    winRate: number | null;
    averageTrade: number | null;
    bestTrade: number | null;
    worstTrade: number | null;
    timeInvested: number | null; // share of candles held
    openTrade: boolean | null; // a position was still open on the last candle
}

/** What the server sends: snake_case, and absent entirely for a run saved before the numbers existed. */
export interface PlainNumbersData {
    max_drawdown?: number | null;
    asset_max_drawdown?: number | null;
    closed_trades?: number | null;
    winning_trades?: number | null;
    win_rate?: number | null;
    average_trade?: number | null;
    best_trade?: number | null;
    worst_trade?: number | null;
    time_invested?: number | null;
    open_trade?: boolean | null;
}

const num = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Null when the server did not send the numbers at all (an older saved run), so the screen can leave the card out. */
export function plainNumbersFromData(data: PlainNumbersData): PlainNumbers | null {
    if (data.closed_trades === undefined && data.max_drawdown === undefined && data.time_invested === undefined) return null;
    return {
        maxDrawdown: num(data.max_drawdown),
        assetMaxDrawdown: num(data.asset_max_drawdown),
        closedTrades: num(data.closed_trades),
        winningTrades: num(data.winning_trades),
        winRate: num(data.win_rate),
        averageTrade: num(data.average_trade),
        bestTrade: num(data.best_trade),
        worstTrade: num(data.worst_trade),
        timeInvested: num(data.time_invested),
        openTrade: typeof data.open_trade === "boolean" ? data.open_trade : null,
    };
}

export interface PlainRow {
    key: "drop" | "trades" | "invested";
    label: string;
    value: string;
    detail: string;
}

const fall = (drawdown: number) => `${Math.abs(drawdown).toFixed(1)}%`;

/** The three rows of the card. A row whose numbers are not known is left out rather than guessed. */
export function plainWordsRows(numbers: PlainNumbers): PlainRow[] {
    const rows: PlainRow[] = [];

    if (numbers.maxDrawdown !== null) {
        const never = Math.abs(numbers.maxDrawdown) < 0.05;
        const holding = numbers.assetMaxDrawdown === null
            ? ""
            : Math.abs(numbers.assetMaxDrawdown) < 0.05
                ? " Just holding never fell."
                : ` Just holding fell ${fall(numbers.assetMaxDrawdown)}.`;
        rows.push({
            key: "drop",
            label: "Biggest drop",
            value: never ? "None" : fall(numbers.maxDrawdown),
            detail: (never
                ? "The strategy never fell below an earlier high."
                : `At its worst the strategy was ${fall(numbers.maxDrawdown)} below its earlier high.`) + holding,
        });
    }

    if (numbers.closedTrades !== null) {
        const open = numbers.openTrade ? " A trade that was still open at the end is not counted." : "";
        if (numbers.closedTrades === 0) {
            rows.push({
                key: "trades",
                label: "Winning trades",
                value: "No finished trades",
                detail: numbers.openTrade
                    ? "A trade was still open at the end of the period."
                    : "The strategy never traded in this period.",
            });
        } else {
            const wins = numbers.winningTrades ?? 0;
            const rate = numbers.winRate !== null ? ` (${Math.round(numbers.winRate)}%)` : "";
            const parts = [
                numbers.averageTrade !== null ? `Average trade ${formatPercent(numbers.averageTrade)}` : null,
                numbers.bestTrade !== null ? `best ${formatPercent(numbers.bestTrade)}` : null,
                numbers.worstTrade !== null ? `worst ${formatPercent(numbers.worstTrade)}` : null,
            ].filter(Boolean);
            rows.push({
                key: "trades",
                label: "Winning trades",
                value: `${wins} of ${numbers.closedTrades}${rate}`,
                detail: "A trade is a buy and the sell that closes it." + (parts.length ? ` ${parts.join(", ")}.` : "") + open,
            });
        }
    }

    if (numbers.timeInvested !== null) {
        const share = numbers.timeInvested;
        rows.push({
            key: "invested",
            label: "Time invested",
            value: share > 0 && share < 1 ? "Under 1%" : `${Math.round(share)}%`,
            detail: "The share of the period the strategy held a position. The rest of the time it was out of the market.",
        });
    }

    return rows;
}
