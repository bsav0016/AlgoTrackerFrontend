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
}