import { apiClient } from "./client";
import type { ApiResponse } from "./client";

export type SignupRequest = {
    email: string;
    password: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type AuthTokenResponse = {
    accessToken: string;
    refreshToken: string;
};

export async function signup(data: SignupRequest) {
    const response = await apiClient.post<ApiResponse<unknown>>(
        "/auth/signup",
        data,
    );

    return response.data;
}

export async function login(data: LoginRequest) {
    const response = await apiClient.post<ApiResponse<AuthTokenResponse>>(
        "/auth/login",
        data,
    );

    return response.data;
}