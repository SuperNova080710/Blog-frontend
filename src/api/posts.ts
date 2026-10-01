import { apiClient } from "./client";
import type { PostListResponse } from "@/types/post";

export async function getPosts(page = 1, limit = 10) {
    const response = await apiClient.get<PostListResponse>("/posts", {
        params: {
            page,
            limit,
        },
    });

    return response.data;
}
