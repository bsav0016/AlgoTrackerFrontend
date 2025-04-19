import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { LoginDTO } from "@/features/auth/dtos/LoginDTO";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { AuthResponseData, AuthResponseDTO } from "./dtos/AuthResponseDTO";
import { AuthFields } from "./AuthFields";
import { AuthType } from "./AuthType";
import { RegisterDTO } from "./dtos/RegisterDTO";
import { User } from "./User";
import { DeviceIdDTO } from "./dtos/DeviceIdDTO";
import { TokenRefreshDTO, TokenRefreshResponseData } from "./dtos/TokenRefreshDTO";
import { ForgotPasswordDTO } from "./dtos/ForgotPasswordDTO";
import { ResetPasswordDTO } from "./dtos/ResetPasswordDTO";
import { NetworkError } from "@/lib/networkRequests/NetworkError";


interface AuthResponseFields {
    user: User;
    refresh: string;
    access: string;
}

export const AuthService = {
    async auth(fields: AuthFields, type: AuthType): Promise<AuthResponseFields> {
        const body = type === AuthType.Login ? (new LoginDTO(fields)).jsonify() : (new RegisterDTO(fields)).jsonify();
        const headers = {
            ...HEADERS().JSON
        }
        const urlExt = type === AuthType.Login ? URL_EXT.LOGIN : URL_EXT.REGISTER
        try {
            const response = await networkRequest(
                urlExt, 
                RequestMethod.POST, 
                headers, 
                body
            );
            const data: AuthResponseData = response.data as AuthResponseData;
            const authResponseDTO: AuthResponseDTO = new AuthResponseDTO(data);
            if (!authResponseDTO.refreshToken || !authResponseDTO.accessToken) {
                throw new NetworkError(
                    "Did not properly receive tokens",
                    500,
                    "Did not properly receive tokens"
                );
            }
            return { 
                user: authResponseDTO.user, 
                refresh: authResponseDTO.refreshToken,
                access: authResponseDTO.accessToken 
            }
        } catch (error) {
            throw(error);
        }
    },

    async resetToken(refreshToken: string) {
        try {
            const body = new TokenRefreshDTO(refreshToken).jsonify();
            const headers = {
                ...HEADERS().JSON
            };
            const response = await networkRequest(
                URL_EXT.TOKEN_REFRESH,
                RequestMethod.POST,
                headers,
                body
            );
            const data = response.data as TokenRefreshResponseData;
            return data.access;
        } catch (error) {
            throw(error);
        }
    },

    async logout(token: string) {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            await networkRequest(
                URL_EXT.LOGOUT, 
                RequestMethod.POST, 
                headers
            );
            return true;
        } catch (error) {
            console.error("Error during logout:", error);
            throw(error);
        }
    },

    async deleteUserAccount(token: string, password: string) {
        try {
            const body = JSON.stringify({ password: password })
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS().JSON
            }
            await networkRequest(
                URL_EXT.DELETE_ACCOUNT,
                RequestMethod.DELETE,
                headers,
                body
            );
            return;
        } catch (error) {
            console.error("Error deleting account: ", error);
            throw(error)
        }
    },

    async sendPasswordResetEmail(email: string) {
        try {
            const body = new ForgotPasswordDTO(email).jsonify();
            const headers = {
                ...HEADERS().JSON
            }
            await networkRequest(
                URL_EXT.PASSWORD_RESET,
                RequestMethod.POST,
                headers,
                body
            )
        } catch (error) {
            throw(error);
        }
    },

    async confirmResetPassword(username: string, otp: number, password: string) {
        try {
            const body = new ResetPasswordDTO(username, otp, password).jsonify();
            const headers = {
                ...HEADERS().JSON
            }
            await networkRequest(
                URL_EXT.PASSWORD_RESET_CONFIRM,
                RequestMethod.POST,
                headers,
                body
            );
        } catch (error) {
            throw(error)
        }
    },

    async addDeviceId(token: string, pushToken: string) {
        try {
            const body = new DeviceIdDTO(pushToken).jsonify()
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS().JSON
            }
            await networkRequest(
                URL_EXT.DEVICE_ID, 
                RequestMethod.POST, 
                headers,
                body
            );
            return true;
        } catch (error) {
            console.error("Error adding deviceId:", error);
            throw(error);
        }
    },

    async deleteDeviceId(token: string, pushToken: string) {
        try {
            const body = new DeviceIdDTO(pushToken).jsonify()
            const headers = {
                ...HEADERS(token).AUTH,
                ...HEADERS().JSON
            }
            await networkRequest(
                URL_EXT.DEVICE_ID, 
                RequestMethod.DELETE, 
                headers,
                body
            );
            return true;
        } catch (error) {
            console.error("Error adding deviceId:", error);
            throw(error);
        }
    },

    async refreshUserData(token: string): Promise<User> {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            const urlExt = URL_EXT.USER_DETAILS;
            const response = await networkRequest(
                urlExt, 
                RequestMethod.GET, 
                headers
            );
            const data: AuthResponseData = response.data as AuthResponseData;
            const authResponseDTO: AuthResponseDTO = new AuthResponseDTO(data);
            return authResponseDTO.user;
        } catch (error) {
            throw(error);
        }
    },

    async getPromoCodeAvailability(): Promise<boolean> {
        try {
            const urlExt = URL_EXT.PROMO_CODE_AVAILABILITY;
            const response = await networkRequest(
                urlExt,
                RequestMethod.GET
            );
            const data = response.data;
            return data.availability;
        } catch (error) {
            throw(error);
        }
    }
}