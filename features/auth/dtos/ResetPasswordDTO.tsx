export class ResetPasswordDTO {
    username: string;
    otp: number;
    password: string;

    constructor (
        username: string,
        otp: number,
        password: string
    ) {
        this.username = username;
        this.otp = otp;
        this.password = password;
    }

    jsonify() {
        return JSON.stringify({
            username: this.username,
            otp: this.otp,
            password: this.password
        })
    }
}