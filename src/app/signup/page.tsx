"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

type SignupForm = {
    email: string;
    password: string;
};

type SignupErrors = Partial<Record<keyof SignupForm, string>>;

function getErrorMessage(message: string | string[]) {
    return Array.isArray(message) ? message.join(", ") : message;
}

export default function SignupPage() {
    const router = useRouter();
    const signup = useAuthStore((state) => state.signup);

    const [form, setForm] = useState<SignupForm>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<SignupErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const nextErrors: SignupErrors = {};

        if (!form.email.trim()) {
            nextErrors.email = "이메일을 입력해주세요.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            nextErrors.email = "올바른 이메일 형식을 입력해주세요.";
        }

        if (!form.password) {
            nextErrors.password = "비밀번호를 입력해주세요.";
        } else if (form.password.length < 8) {
            nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
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
            await signup(form);
            router.push("/login");
        } catch (error) {
            const apiError = getApiError(error);

            setSubmitError(getErrorMessage(apiError.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Signup</h1>
                <p className="text-foreground/70">
                    이메일과 비밀번호를 입력해주세요.
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium"
                    >
                        이메일
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => {
                            setForm((current) => ({
                                ...current,
                                email: event.target.value,
                            }));
                            setSubmitError("");
                        }}
                        className="w-full rounded-md border border-foreground/20 px-3 py-2 outline-none focus:border-foreground"
                        autoComplete="email"
                    />
                    {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium"
                    >
                        비밀번호
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={(event) => {
                            setForm((current) => ({
                                ...current,
                                password: event.target.value,
                            }));
                            setSubmitError("");
                        }}
                        className="w-full rounded-md border border-foreground/20 px-3 py-2 outline-none focus:border-foreground"
                        autoComplete="new-password"
                    />
                    {errors.password && (
                        <p className="text-sm text-red-600">
                            {errors.password}
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
                    {isSubmitting ? "회원가입 중..." : "회원가입"}
                </button>
            </form>

            <p className="text-center text-sm text-foreground/70">
                이미 계정이 있으신가요?{" "}
                <Link
                    href="/login"
                    className="font-medium text-foreground underline"
                >
                    로그인
                </Link>
            </p>
        </section>
    );
}