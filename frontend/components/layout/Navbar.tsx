import Link from "next/link"
import { auth } from "@/auth"
import UserMenu from "./UserMenu"
import Logo from "@/components/Logo"

export default async function Navbar() {
    const session = await auth()

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Logo size={32} />
                    <span className="font-bold text-lg tracking-tight text-white">ReviewAI</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#demo" className="hover:text-white transition-colors">How it works</a>
                    <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>

                <div className="flex items-center gap-4">
                    {session?.user ? (
                        <UserMenu user={session.user} />
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                            >
                                Start Free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
