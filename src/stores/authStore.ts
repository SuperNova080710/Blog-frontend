import { create } from "zustand";
import {
    getCurrentUser,
    login as loginApi,
    logout as logoutApi,
    signup as signupApi,
} from "@/api/auth";
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

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,

    signup: async (data) => {
        return signupApi(data);
    },

    login: async (data) => {
        const tokenResponse = await loginApi(data);

        set({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
        });

        try {
            const user = await getCurrentUser(tokenResponse.accessToken);

            set({
                currentUser: user,
                isAuthenticated: true,
            });

            return user;
        } catch (error) {
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
        const accessToken = get().accessToken;

        if (!accessToken) {
            throw new Error("Access Token이 없습니다.");
        }

        try {
            const user = await getCurrentUser(accessToken);

            set({
                currentUser: user,
                isAuthenticated: true,
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
        const refreshToken = get().refreshToken;

        try {
            if (refreshToken) {
                await logoutApi({ refreshToken });
            }
        } finally {
            set({
                currentUser: null,
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
            });
        }
    },
}));