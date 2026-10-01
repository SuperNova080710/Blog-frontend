export type PostAuthor = {
    id: number;
    email: string;
};

export type Post = {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: PostAuthor;
};

export type PostListMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type PostListResponse = {
    data: Post[];
    meta: PostListMeta;
};
