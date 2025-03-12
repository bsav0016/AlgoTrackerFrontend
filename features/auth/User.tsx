import { Strategy } from "../strategy/classes/Strategy";

export class User {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    accountCreated: Date;
    strategies: Strategy[];
    accountFunds: number;
    monthlyFunds: number;
    resetMonthlyFunds: Date;

    constructor(
        username: string,
        firstName: string,
        lastName: string,
        email: string,
        accountCreated: Date,
        strategies: Strategy[],
        accountFunds: number,
        monthlyFunds: number,
        resetMonthlyFunds: Date
    ) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.accountCreated = accountCreated;
        this.strategies = strategies;
        this.accountFunds = accountFunds;
        this.monthlyFunds = monthlyFunds;
        this.resetMonthlyFunds = resetMonthlyFunds
    }
}