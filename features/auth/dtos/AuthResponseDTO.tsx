import { User } from "../User";
import { Strategy, StrategyData } from "@/features/strategy/classes/Strategy";

export interface AuthResponseData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    account_created: string;
    strategies: StrategyData[];
    account_funds: number;
    free_backtests: number;
    refresh_token: string;
    access_token: string;
}

export class AuthResponseDTO {
    user: User;
    refreshToken: string;
    accessToken: string;

    constructor(data: AuthResponseData) {
        let strategies: Strategy[] = []
        for (const strategy of data.strategies) {
            const loadedStrategy: Strategy = Strategy.fromData(strategy);
            strategies.push(loadedStrategy);
        }

        const accountCreated = new Date(data.account_created);

        this.user = new User(
            data.username,
            data.first_name,
            data.last_name,
            data.email,
            accountCreated,
            strategies,
            data.account_funds,
            data.free_backtests
        )

        this.refreshToken = data.refresh_token;
        this.accessToken = data.access_token;
    }
}
