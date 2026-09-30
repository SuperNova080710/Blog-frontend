import { create } from "zustand";
import {
    getCurrentUser,
    login as loginApi,
    logout as logoutApi,
    signup as signupApi,
} from "@/api/auth";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    setTokens,
} from "@/api/token-storage";
import type {
    LoginRequest,
    SignupRequest,
    User,
} from "@/types/auth";

type AuthState = {
    currentUser: User | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;

    signup: (data: SignupRequest) => Promise<User>;
    login: (data: LoginRequest) => Promise<User>;
    fetchCurrentUser: () => Promise<User>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    currentUser: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,

    signup: async (data) => {
        return signupApi(data);
    },

    login: async (data) => {
        const tokenResponse = await loginApi(data);

        setTokens(
            tokenResponse.accessToken,
            tokenResponse.refreshToken,
        );

        set({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
        });

        try {
            const user = await getCurrentUser();

            set({
                currentUser: user,
                isAuthenticated: true,
            });

            return user;
        } catch (error) {
            clearTokens();

            set({
                currentUser: null,
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
            });

            throw error;
        }
    },

    fetchCurrentUser: async () => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            throw new Error("Access Token이 없습니다.");
        }

        try {
            const user = await getCurrentUser();

            set({
                currentUser: user,
                isAuthenticated: true,
                accessToken,
                refreshToken: getRefreshToken(),
            });

            return user;
        } catch (error) {
            set({
                currentUser: null,
                isAuthenticated: false,
            });

            throw error;
        }
    },

    logout: async () => {
        const refreshToken = getRefreshToken();

        try {
            if (refreshToken) {
                await logoutApi({ refreshToken });
            }
        } finally {
            clearTokens();

            set({
                currentUser: null,
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
            });
        }
    },
}));