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
                if (!credentials?.username || !credentials?.password) return null;

                try {
                    // We must use the Docker service name 'backend-api' if this runs on server
                    // But if it runs on client? NextAuth authorize runs on server.
                    // Let's use an env var or a network-aware URL.
                    // For now, assuming internal docker network.
                    const res = await fetch("http://backend-api:8000/api/v1/auth/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            username: credentials.username as string,
                            password: credentials.password as string,
                        }),
                        cache: 'no-store'
                    });

                    if (!res.ok) {
                        console.error("Auth failed:", await res.text());
                        return null;
                    }

                    const tokenData = await res.json();
                    const accessToken = tokenData.access_token;

                    // Fetch user details
                    const userRes = await fetch("http://backend-api:8000/api/v1/auth/me", {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        },
                        cache: 'no-store'
                    });

                    let name = "User";
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        if (userData.first_name || userData.last_name) {
                            name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                        }
                    }

                    return {
                        id: credentials.username as string,
                        name: name,
                        email: credentials.username as string,
                        accessToken: accessToken
                    };
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        }
    },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
