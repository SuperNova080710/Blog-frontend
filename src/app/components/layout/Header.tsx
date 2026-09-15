import Link from "next/link";
import Navigation from "./Navigation";

export default function Header() {
    return (
        <header className="border-b border-foreground/10">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Link href="/" className="text-xl font-bold">
                    Blog
                </Link>

                <Navigation />
            </div>
        </header>
    )
}