import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    setTokens,
} from "./token-storage";
import { handleAuthFailure } from "./auth-failure";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.");
}

export type ApiResponse<T> = {
    data: T;
};

export type ApiError = {
    statusCode: number;
    message: string | string[];
    error?: string;
};

type AuthTokenResponse = {
    accessToken: string;
    refreshToken: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

const refreshClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

export const apiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | RetryableRequestConfig
            | undefined;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            clearTokens();
            handleAuthFailure();

            return Promise.reject(error);
        }

        try {
            const response = await refreshClient.post<
                ApiResponse<AuthTokenResponse>
            >(
                "/auth/refresh",
                {
                    refreshToken,
                },
            );

            const tokenResponse = response.data.data;

            setTokens(
                tokenResponse.accessToken,
                tokenResponse.refreshToken,
            );

            return apiClient(originalRequest);
        } catch (refreshError) {
            clearTokens();
            handleAuthFailure();

            return Promise.reject(refreshError);
        }
    },
);

export function getApiError(error: unknown): ApiError {
    if (axios.isAxiosError<ApiError>(error) && error.response?.data) {
        return {
            statusCode: error.response.status,
            message: error.response.data.message,
            error: error.response.data.error,
        };
    }

    return {
        statusCode: 0,
        message: "API 요청중 알 수 없는 오류가 발생했습니다.",
    };
}
