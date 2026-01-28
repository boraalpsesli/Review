"use client"

import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Check for registration success
    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setSuccess("Account created successfully! Please sign in.")
        }
        if (searchParams.get("error")) {
            setError("Authentication failed. Please check your credentials.")
        }
    }, [searchParams])

    async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("username") as string
        const password = formData.get("password") as string

        try {
            const result = await signIn("credentials", {
                username: email,
                password: password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password.")
                setIsLoading(false)
            } else {
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            console.error("Login Error:", error)
            setError("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setIsLoading(true)
        await signIn("google", { callbackUrl: "/" })
    }

    return (
        <div className="min-h-screen bg-black grid lg:grid-cols-2">
            {/* Left: Testimonial & Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 border-r border-white/10 p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[100px] rounded-full"></div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                        ReviewAI
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Data-driven decisions for modern restaurants.
                    </h2>
                    <p className="text-lg text-zinc-300 leading-relaxed">
                        Join hundreds of innovative teams using AI to turn customer feedback into actionable growth strategies. Monitor, analyze, and improve in real-time.
                    </p>
                </div>

                <div className="relative z-10 text-zinc-500 text-sm">
                    © 2026 ReviewAI Inc.
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative">
                <Link href="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
                        <p className="text-zinc-400 mt-2">Enter your email specifically to sign in.</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <div className="grid gap-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
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
                            {isLoading ? "Connecting..." : "Continue with Google"}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-2 text-zinc-500">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <input
                                name="username"
                                type="email"
                                placeholder="name@example.com"
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Sign In
                            </button>
                        </form>
                    </div>

                    <p className="px-8 text-center text-sm text-zinc-500">
                        By clicking continue, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-white underline-offset-4">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-white underline-offset-4">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
