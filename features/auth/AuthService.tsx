import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { LoginDTO } from "@/features/auth/dtos/LoginDTO";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { AuthResponseData, AuthResponseDTO } from "./dtos/AuthResponseDTO";
import { AuthFields } from "./AuthFields";
import { AuthType } from "./AuthType";
import { RegisterDTO } from "./dtos/RegisterDTO";
import { User } from "./User";

interface AuthResponseFields {
    user: User;
    refresh: string;
    access: string;
}

export const AuthService = {
    async auth(fields: AuthFields, type: AuthType): Promise<AuthResponseFields> {
        const body = type === AuthType.Login ? (new LoginDTO(fields)).jsonify() : (new RegisterDTO(fields)).jsonify()
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
            )
            const data: AuthResponseData = response.data as AuthResponseData;
            const authResponseDTO: AuthResponseDTO = new AuthResponseDTO(data);
            return { 
                user: authResponseDTO.user, 
                refresh: authResponseDTO.refreshToken,
                access: authResponseDTO.accessToken 
            }
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
    }
      
}