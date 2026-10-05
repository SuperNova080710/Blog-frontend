"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/api/posts";
import { getApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

type CreatePostForm = {
    title: string;
    content: string;
};

type CreatePostErrors = Partial<Record<keyof CreatePostForm, string>>;

function getErrorMessage(message: string | string[]) {
    return Array.isArray(message) ? message.join(", ") : message;
}

export default function CreatePostPage() {
    const router = useRouter();
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated,
    );

    const [form, setForm] = useState<CreatePostForm>({
        title: "",
        content: "",
    });
    const [errors, setErrors] = useState<CreatePostErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login");
        }
    }, [isAuthenticated, router]);

    const validate = () => {
        const nextErrors: CreatePostErrors = {};
        const title = form.title.trim();
        const content = form.content.trim();

        if (!title) {
            nextErrors.title = "제목을 입력해주세요.";
        } else if (title.length > 200) {
            nextErrors.title = "제목은 200자 이하로 입력해주세요.";
        }

        if (!content) {
            nextErrors.content = "내용을 입력해주세요.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSubmitError("");

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const post = await createPost({
                title: form.title.trim(),
                content: form.content.trim(),
            });

            router.push(`/posts/${post.id}`);
        } catch (error) {
            const apiError = getApiError(error);

            setSubmitError(getErrorMessage(apiError.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <section className="mx-auto w-full max-w-2xl space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create Post</h1>
                <p className="text-foreground/70">
                    새로운 게시글을 작성해주세요.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
            >
                <div className="space-y-2">
                    <label
                        htmlFor="title"
                        className="block text-sm font-medium"
                    >
                        제목
                    </label>

                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={(event) => {
                            setForm((current) => ({
                                ...current,
                                title: event.target.value,
                            }));
                            setErrors((current) => ({
                                ...current,
                                title: undefined,
                            }));
                            setSubmitError("");
                        }}
                        maxLength={200}
                        className="w-full rounded-md border border-foreground/20 px-3 py-2 outline-none focus:border-foreground"
                        disabled={isSubmitting}
                    />

                    {errors.title && (
                        <p className="text-sm text-red-600">
                            {errors.title}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="content"
                        className="block text-sm font-medium"
                    >
                        내용
                    </label>

                    <textarea
                        id="content"
                        name="content"
                        value={form.content}
                        onChange={(event) => {
                            setForm((current) => ({
                                ...current,
                                content: event.target.value,
                            }));
                            setErrors((current) => ({
                                ...current,
                                content: undefined,
                            }));
                            setSubmitError("");
                        }}
                        rows={12}
                        className="w-full resize-y rounded-md border border-foreground/20 px-3 py-2 outline-none focus:border-foreground"
                        disabled={isSubmitting}
                    />

                    {errors.content && (
                        <p className="text-sm text-red-600">
                            {errors.content}
                        </p>
                    )}
                </div>

                {submitError && (
                    <p
                        role="alert"
                        className="text-sm text-red-600"
                    >
                        {submitError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? "작성 중..." : "게시글 작성"}
                </button>
            </form>
        </section>
    );
}