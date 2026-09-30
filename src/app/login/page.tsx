"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginForm = {
    email: string;
    password: string;
};

type LoginErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginPage() {
    const [form, setForm] = useState<LoginForm>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<LoginErrors>({});

    const validate = () => {
        const nextErrors: LoginErrors = {};

        if (!form.email.trim()) {
            nextErrors.email = "이메일을 입력해주세요.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            nextErrors.email = "올바른 이메일 형식을 입력해주세요.";
        }

        if (!form.password) {
            nextErrors.password = "비밀번호를 입력해주세요.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }
    };

    return (
        <section className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Login</h1>
                <p className="text-foreground/70">
                    이메일과 비밀번호를 입력해주세요.
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
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
                        }}
                        className="w-full rounded-md border border-foreground/20 px-3 py-2 outline-none focus:border-foreground"
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <p className="text-sm text-red-600">
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full rounded-md bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-80"
                >
                    로그인
                </button>
            </form>

            <p className="text-center text-sm text-foreground/70">
                계정이 없으신가요?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-foreground underline"
                >
                    회원가입
                </Link>
            </p>
        </section>
    );
}