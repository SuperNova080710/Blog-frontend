import { apiClient } from "./client";
import type { ApiResponse } from "./client";

export type PostResponse<T> = ApiResponse<T>;

export async function getPosts<T = unknown>() {
    const response = await apiClient.get<PostResponse<T>>("/posts");

    return response.data;
}