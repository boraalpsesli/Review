"use client";

import { signIn } from "next-auth/react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;

        try {
            const res = await fetch("http://localhost:8000/api/v1/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Registration failed");
            }

            // Success - Redirect to login
            router.push("/login?registered=true");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black grid lg:grid-cols-2">
            {/* Left: Testimonial & Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 border-r border-white/10 p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full"></div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                        ReviewAI
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Join the future of restaurant analytics.
                    </h2>
                    <ul className="space-y-4 text-zinc-400 text-lg">
                        <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Import unlimited reviews
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            AI-powered sentiment analysis
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            Competitor benchmarking
                        </li>
                    </ul>
                </div>

                <div className="relative z-10 text-zinc-500 text-sm animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                    © 2026 ReviewAI Inc.
                </div>
            </div>

            {/* Right: Register Form */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <Link href="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
                        <p className="text-zinc-400 mt-2">Start your 14-day free trial. No credit card required.</p>
                    </div>

                    <div className="grid gap-4">
                        <button
                            onClick={() => signIn("google")}
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 focus:ring-offset-black"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-zinc-500">Or continue with email</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    name="firstName"
                                    type="text"
                                    placeholder="First Name"
                                    required
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    name="lastName"
                                    type="text"
                                    placeholder="Last Name"
                                    required
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="Create Password"
                                required
                                minLength={8}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-zinc-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-white hover:underline underline-offset-4">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
