import Link from "next/link";

const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/posts", label: "Posts" },
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Signup" },
];

export default function Navigation() {
    return (
        <nav aria-label="주요 메뉴">
            <ul className="flex flex-wrap items-center justify-end gap-4 text-sm sm:gap-6">
                {navigationItems.map((item) => (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className="transition-opacity hover:opacity-70"
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}