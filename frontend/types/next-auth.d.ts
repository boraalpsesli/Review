import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        accessToken?: string
        user: {
            /** The user's postal address. */
            id: string
            accessToken?: string
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        accessToken?: string
        first_name?: string
        last_name?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        accessToken?: string
    }
}
