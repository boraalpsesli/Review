'use client'

import { createContext, useContext, ReactNode } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: Session['user'] | null
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
})

function AuthContextInner({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()

    const value: AuthContextType = {
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        user: session?.user ?? null,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

interface AuthProviderProps {
    children: ReactNode
    session?: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
    return (
        <SessionProvider session={session}>
            <AuthContextInner>{children}</AuthContextInner>
        </SessionProvider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
