export class ForgotPasswordDTO {
    email: string;

    constructor (
        email: string
    ) {
        this.email = email;
    }

    jsonify() {
        return JSON.stringify({
            email: this.email
        })
    }
}