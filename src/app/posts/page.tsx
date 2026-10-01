"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPosts } from "@/api/posts";
import type { Post } from "@/types/post";

const PAGE_SIZE = 10;

export default function PostsPage() {
    const searchParams = useSearchParams();
    const pageParam = Number(searchParams.get("page"));
    const page =
        Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;

    return <PostsList key={page} page={page} />;
}

function PostsList({ page }: { page: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [posts, setPosts] = useState<Post[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadPosts() {
            try {
                const response = await getPosts(page, PAGE_SIZE);

                if (cancelled) return;

                setPosts(response.data);
                setTotal(response.meta.total);
                setTotalPages(response.meta.totalPages);
            } catch {
                if (cancelled) return;

                setPosts([]);
                setTotal(0);
                setTotalPages(0);
                setError("게시글을 불러오지 못했습니다.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadPosts();

        return () => {
            cancelled = true;
        };
    }, [page]);

    function moveToPage(nextPage: number) {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(nextPage));

        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Posts</h1>
                <p className="text-foreground/70">
                    전체 게시글 {total}개
                </p>
            </div>

            {loading && (
                <div
                    className="rounded-lg border p-6 text-center text-foreground/70"
                    aria-live="polite"
                >
                    게시글을 불러오는 중입니다.
                </div>
            )}

            {!loading && error && (
                <div
                    className="rounded-lg border p-6 text-center text-red-600"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {!loading && !error && posts.length === 0 && (
                <div className="rounded-lg border p-6 text-center text-foreground/70">
                    등록된 게시글이 없습니다.
                </div>
            )}

            {!loading && !error && posts.length > 0 && (
                <div className="space-y-4">
                    <div className="divide-y rounded-lg border">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/posts/${post.id}`}
                                className="block p-5 transition-colors hover:bg-foreground/5"
                            >
                                <article className="space-y-2">
                                    <h2 className="text-xl font-semibold">
                                        {post.title}
                                    </h2>

                                    <p className="line-clamp-2 text-foreground/70">
                                        {post.content}
                                    </p>

                                    <div className="text-sm text-foreground/60">
                                        {post.author.email} ·{" "}
                                        {new Date(
                                            post.createdAt,
                                        ).toLocaleDateString("ko-KR")}
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <nav
                            className="flex flex-wrap items-center justify-center gap-2"
                            aria-label="게시글 페이지네이션"
                        >
                            <button
                                type="button"
                                onClick={() => moveToPage(page - 1)}
                                disabled={page === 1}
                                className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                이전
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1,
                            ).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => moveToPage(pageNumber)}
                                    aria-current={
                                        pageNumber === page ? "page" : undefined
                                    }
                                    className={`rounded-md border px-3 py-2 text-sm ${pageNumber === page
                                            ? "font-semibold"
                                            : ""
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => moveToPage(page + 1)}
                                disabled={page === totalPages}
                                className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                다음
                            </button>
                        </nav>
                    )}
                </div>
            )}
        </section>
    );
}
