import { apiClient } from "./client";
import type { ApiResponse } from "./client";
import type {
    AuthTokenResponse,
    LoginRequest,
    RefreshTokenRequest,
    SignupRequest,
    User,
} from "@/types/auth";

export async function signup(data: SignupRequest) {
    const response = await apiClient.post<ApiResponse<User>>(
        "/auth/signup",
        data,
    );

    return response.data.data;
}

export async function login(data: LoginRequest) {
    const response = await apiClient.post<ApiResponse<AuthTokenResponse>>(
        "/auth/login",
        data,
    );

    return response.data.data;
}

export async function getCurrentUser() {
    const response = await apiClient.get<ApiResponse<User>>(
        "/auth/me",
    );

    return response.data.data;
}

export async function refresh(data: RefreshTokenRequest) {
    const response = await apiClient.post<ApiResponse<AuthTokenResponse>>(
        "/auth/refresh",
        data,
    );

    return response.data.data;
}

export async function logout(data: RefreshTokenRequest) {
    await apiClient.post("/auth/logout", data);
}