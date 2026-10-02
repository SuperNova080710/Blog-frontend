import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPost } from "@/api/posts";

type PostDetailPageProps = {
    params: Promise<{ id: string }>;
};

function formatDate(date: string) {
    return new Date(date).toLocaleString("ko-KR");
}

export default async function PostDetailPage({
    params,
}: PostDetailPageProps) {
    const { id } = await params;
    const postId = Number(id);

    if (!Number.isInteger(postId) || postId <= 0) {
        notFound();
    }

    let post;

    try {
        post = await getPost(postId);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            notFound();
        }

        throw error;
    }

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{post.title}</h1>

                <div className="text-sm text-foreground/60">
                    <p>작성자: {post.author.email}</p>
                    <p>작성일: {formatDate(post.createdAt)}</p>
                    <p>수정일: {formatDate(post.updatedAt)}</p>
                </div>
            </div>

            <div className="whitespace-pre-wrap rounded-lg border p-6">
                {post.content}
            </div>

            <Link
                href="/posts"
                className="inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
            >
                목록으로 돌아가기
            </Link>
        </section>
    );
}