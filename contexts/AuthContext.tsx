import React, { createContext, useEffect, useRef, ReactNode, useState } from 'react';
import { AuthService } from '@/features/auth/AuthService';
import * as SecureStore from 'expo-secure-store';
import { NetworkError } from '@/lib/networkRequests/NetworkError';
import { AuthFields } from '@/features/auth/AuthFields';
import { AuthType } from '@/features/auth/AuthType';
import { useUser } from './UserContext';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { useToast } from './ToastContext';

interface AuthContextType {
    accessToken: string | null;
    auth: (fields: AuthFields, type: AuthType) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const REFRESH_TOKEN_STRING = "refreshToken";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setUser } = useUser();
    const { addToast } = useToast();

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [updatingToken, setUpdatingToken] = useState<boolean>(false);

    const accessTokenTimerRef = useRef<NodeJS.Timeout | null>(null);
    const refreshTokenTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const getStoredAuthData = async () => {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STRING);
            if (!storedRefreshToken) return;
            await checkRefreshToken(storedRefreshToken, true);
        };

        getStoredAuthData();
    }, []);

    useEffect(() => {
        if (!accessToken) return;

        const buffer = 10 * 1000; // 10 seconds before expiration
        let accessTokenExpiration = getTokenExpiration(accessToken) - buffer;

        if (accessTokenTimerRef.current) {
            clearTimeout(accessTokenTimerRef.current);
        }

        if (accessTokenExpiration <= 0) {
            refreshAccessToken(); // Immediately refresh if expired
        } else {
            accessTokenTimerRef.current = setTimeout(refreshAccessToken, accessTokenExpiration);
        }

        return () => {
            if (accessTokenTimerRef.current) {
                clearTimeout(accessTokenTimerRef.current);
            }
        };
    }, [accessToken]);

    const refreshAccessToken = async () => {
        setUpdatingToken(true);
        const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STRING);
        if (!storedRefreshToken) {
            console.error('No refresh token available.');
            setUpdatingToken(false);
            return;
        }

        try {
            const newAccessToken = await AuthService.resetToken(storedRefreshToken);
            setAccessToken(newAccessToken);
        } catch (error) {
            console.error('Failed to update token:', error);
        } finally {
            setUpdatingToken(false);
        }
    };

    const getTokenExpiration = (token: string): number => {
        const decodedToken = jwtDecode(token);
        if (decodedToken && decodedToken.exp) {
            return decodedToken.exp * 1000 - Date.now();
        }
        return -1;
    };

    const checkRefreshToken = async (refreshToken: string, initialLoad: boolean) => {
        let refreshExpiration = getTokenExpiration(refreshToken);

        const buffer = 3600000 //3600 s
        refreshExpiration = refreshExpiration - buffer;

        if (refreshExpiration <= 0) {
            await logoutAfterLoginExpiration();
        } else {
            refreshTokenTimerRef.current = setTimeout(logoutAfterLoginExpiration, refreshExpiration);
        }

        if (initialLoad) {
            try {
                const newAccessToken = await AuthService.resetToken(refreshToken);
                setAccessToken(newAccessToken);
            } catch (error) {
                console.error("Could not get new access token: ", error);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (refreshTokenTimerRef.current) {
                clearTimeout(refreshTokenTimerRef.current);
            }
        };
    }, []);

    const logoutAfterLoginExpiration = async () => {
        addToast("Your login has expired after 30 days");
        await logout();
    };

    const auth = async (fields: AuthFields, type: AuthType): Promise<boolean> => {
        try {
            const { user, refresh, access } = await AuthService.auth(fields, type);
            setUser(user);
            setAccessToken(access);
            await SecureStore.setItemAsync(REFRESH_TOKEN_STRING, refresh);
            await checkRefreshToken(refresh, false);
            return true;
        } catch (error) {
            if (error instanceof NetworkError && error.status === 403) {
                return false;
            }
            if (error instanceof NetworkError && error.status === 409) {
                if (error.message.includes("username already")) {
                    throw new Error("Username already taken");
                } else if (error.message.includes("email already")) {
                    throw new Error("Email already taken");
                } else if (error.message.includes("valid email")) {
                    throw new Error("Enter a valid email");
                } else if (error.message.includes("promo code")) {
                    throw new Error("Invalid promo code");
                }
            }
            throw new Error('Network error');
        }
    };

    const logout = async () => {
        try {
            if (!accessToken) return;
            setUser(null);
            setAccessToken(null);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_STRING);
            await AuthService.logout(accessToken);
        } catch (error) {
            throw error;
        } finally {
            router.push('/(screens)/login-screen');
        }
    };

    return (
        <AuthContext.Provider value={{ accessToken, auth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
