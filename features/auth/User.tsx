import { Strategy } from "../strategy/classes/Strategy";

export class User {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    accountCreated: Date;
    strategies: Strategy[];
    accountCredits: number;
    monthlyCredits: number;
    resetMonthlyCredits: Date;

    constructor(
        username: string,
        firstName: string,
        lastName: string,
        email: string,
        accountCreated: Date,
        strategies: Strategy[],
        accountCredits: number,
        monthlyCredits: number,
        resetMonthlyCredits: Date
    ) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.accountCreated = accountCreated;
        this.strategies = strategies;
        this.accountCredits = accountCredits;
        this.monthlyCredits = monthlyCredits;
        this.resetMonthlyCredits = resetMonthlyCredits
    }

    /** Rebuilds a user from the JSON kept in AsyncStorage, where every Date has become a string. */
    static fromStored(stored: any): User {
        return new User(
            stored.username,
            stored.firstName,
            stored.lastName,
            stored.email,
            new Date(stored.accountCreated),
            (stored.strategies ?? []).map((strategy: any) => Strategy.fromStored(strategy)),
            stored.accountCredits,
            stored.monthlyCredits,
            new Date(stored.resetMonthlyCredits)
        );
    }
}
