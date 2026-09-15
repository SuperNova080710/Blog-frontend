import axios from "axios";

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

export const apiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

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