/**
 * Exit rules: sell because of how the price has moved since the buy, not because an indicator crossed. The server
 * judges them on each candle's close. Values are percentages: a stop-loss of 5 sells when the close is 5% below the
 * entry price, a take-profit of 10 when it is 10% above, and a trailing stop of 4 when it is 4% below the highest
 * close since the buy. A rule that is missing is off.
 */
export type ExitRuleName = "stop_loss" | "take_profit" | "trailing_stop";
export type ExitRules = Partial<Record<ExitRuleName, number>>;

export const EXIT_RULE_NAMES: ExitRuleName[] = ["stop_loss", "trailing_stop", "take_profit"];

export const EXIT_RULE_LABELS: Record<ExitRuleName, string> = {
    stop_loss: "Stop-loss",
    trailing_stop: "Trailing stop",
    take_profit: "Take-profit",
};

/** The server refuses anything outside these (percent), so the form checks them first. */
export const EXIT_RULE_LIMITS: Record<ExitRuleName, [number, number]> = {
    stop_loss: [0.01, 99.99],
    trailing_stop: [0.01, 99.99],
    take_profit: [0.01, 1000],
};

export type ExitRuleInputs = Record<ExitRuleName, string>;

export const EMPTY_EXIT_RULE_INPUTS: ExitRuleInputs = { stop_loss: "", trailing_stop: "", take_profit: "" };

export type ParsedExitRules = { rules: ExitRules; error?: undefined } | { rules?: undefined; error: string };

/** Turns what was typed into rules. A blank box is a rule that is off; anything else must be a percentage in range. */
export function parseExitRules(inputs: ExitRuleInputs): ParsedExitRules {
    const rules: ExitRules = {};
    for (const name of EXIT_RULE_NAMES) {
        const text = inputs[name].trim().replace(",", ".");
        if (text === "") continue;
        const value = Number(text);
        const [low, high] = EXIT_RULE_LIMITS[name];
        if (!Number.isFinite(value) || value < low || value > high) {
            return { error: `${EXIT_RULE_LABELS[name]} must be a percent between ${low} and ${high}, or left blank` };
        }
        rules[name] = value;
    }
    return { rules };
}

/** Reads rules from the server or from storage. Unknown names and bad values are dropped rather than trusted. */
export function exitRulesFromData(data: unknown): ExitRules {
    const rules: ExitRules = {};
    if (!data || typeof data !== "object") return rules;
    for (const name of EXIT_RULE_NAMES) {
        const value = (data as Record<string, unknown>)[name];
        if (typeof value === "number" && Number.isFinite(value) && value > 0) rules[name] = value;
    }
    return rules;
}

/** The rules as the builder's boxes hold them: a rule that is on is its number, one that is off is blank. */
export function exitRulesToInputs(rules: ExitRules): ExitRuleInputs {
    const inputs: ExitRuleInputs = { ...EMPTY_EXIT_RULE_INPUTS };
    for (const name of EXIT_RULE_NAMES) {
        if (rules[name] !== undefined) inputs[name] = String(rules[name]);
    }
    return inputs;
}

export const hasExitRules = (rules: ExitRules): boolean => EXIT_RULE_NAMES.some((name) => rules[name] !== undefined);

/** The request body part: only the rules that are on, in the server's field names. */
export function exitRulesToJSON(rules: ExitRules): ExitRules {
    const body: ExitRules = {};
    for (const name of EXIT_RULE_NAMES) {
        if (rules[name] !== undefined) body[name] = rules[name];
    }
    return body;
}

/** One rule in words, e.g. "Sell if the price falls 5% below the buy price". */
export function describeExitRule(name: ExitRuleName, percent: number): string {
    switch (name) {
        case "stop_loss":
            return `Sell if the price falls ${percent}% below the buy price`;
        case "trailing_stop":
            return `Sell if the price falls ${percent}% below its highest point since the buy`;
        case "take_profit":
            return `Sell if the price rises ${percent}% above the buy price`;
    }
}

export function describeExitRules(rules: ExitRules): string[] {
    return EXIT_RULE_NAMES.filter((name) => rules[name] !== undefined).map((name) => describeExitRule(name, rules[name]!));
}

/** "Stop-loss", "Take-profit" or "Trailing stop" for a trade's exit reason; null for a plain signal sell or an unknown reason. */
export function exitReasonLabel(reason: string | null | undefined): string | null {
    return reason && reason in EXIT_RULE_LABELS ? EXIT_RULE_LABELS[reason as ExitRuleName] : null;
}

/** "2 stop-loss exits, 1 take-profit exit" for the trades that a rule ended; null when none did. */
export function summarizeExits(reasons: (string | null | undefined)[]): string | null {
    const parts: string[] = [];
    for (const name of EXIT_RULE_NAMES) {
        const count = reasons.filter((reason) => reason === name).length;
        if (count > 0) parts.push(`${count} ${EXIT_RULE_LABELS[name].toLowerCase()} ${count === 1 ? "exit" : "exits"}`);
    }
    return parts.length > 0 ? parts.join(", ") : null;
}
