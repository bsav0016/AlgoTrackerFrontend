import { AuthFields } from "../AuthFields";

export class RegisterDTO {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    promoCode: string;

    constructor(
        fields: AuthFields
    ) {
        if (
            !fields.username || 
            !fields.firstName || 
            !fields.lastName || 
            !fields.email || 
            !fields.password || 
            !fields.confirmPassword
        ) {
            throw new Error('Not all fields provided');
        }
        
        this.username = fields.username;
        this.firstName = fields.firstName;
        this.lastName = fields.lastName;
        this.email = fields.email;
        this.password = fields.password;
        this.confirmPassword = fields.confirmPassword;
        this.promoCode = fields.promoCode === undefined ? "N/A" : fields.promoCode;
    }

    jsonify() {
        if (!(this.password === this.confirmPassword)) {
            throw new Error("Passwords don't match");
        }

        console.log(this.promoCode)

        return JSON.stringify({
            username: this.username,
            first_name: this.firstName,
            last_name: this.lastName,
            email: this.email,
            password: this.password,
            promo_code: this.promoCode
        })
    }
}