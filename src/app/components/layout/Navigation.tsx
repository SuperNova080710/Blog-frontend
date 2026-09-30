"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuthFailureHandler } from "@/api/auth-failure";
import { useAuthStore } from "@/stores/authStore";

export default function Navigation() {
    const router = useRouter();
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated,
    );
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        setAuthFailureHandler(() => {
            router.push("/login");
        });

        return () => {
            setAuthFailureHandler(() => { });
        };
    }, [router]);
    return (
        <nav aria-label="주요 메뉴">
            <ul className="flex flex-wrap items-center justify-end gap-4 text-sm sm:gap-6">
                <li>
                    <Link
                        href="/"
                        className="transition-opacity hover:opacity-70"
                    >
                        Home
                    </Link>
                </li>

                <li>
                    <Link
                        href="/posts"
                        className="transition-opacity hover:opacity-70"
                    >
                        Posts
                    </Link>
                </li>

                {isAuthenticated ? (
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                void logout();
                            }}
                            className="transition-opacity hover:opacity-70"
                        >
                            Logout
                        </button>
                    </li>
                ) : (
                    <>
                        <li>
                            <Link
                                href="/login"
                                className="transition-opacity hover:opacity-70"
                            >
                                Login
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/signup"
                                className="transition-opacity hover:opacity-70"
                            >
                                Signup
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}