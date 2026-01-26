import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export const config = {
    theme: {
        logo: "https://next-auth.js.org/img/logo/logo-sm.png",
    },
    providers: [
        Google,
        Credentials({
            credentials: {
                username: { label: "Username" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Placeholder logic until backend API is ready
                // TODO: Replace with fetch to backend API
                if (credentials?.username === "user" && credentials?.password === "password") {
                    return {
                        id: "1",
                        name: "Demo User",
                        email: "user@example.com",
                    };
                }
                return null;
            }
        }),
    ],
    pages: {
        signIn: '/login', // Custom sign-in page
    },
    callbacks: {
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl
            if (pathname === "/middleware-example") return !!auth
            return true
        },
    },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
