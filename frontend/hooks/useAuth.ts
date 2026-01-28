'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

/**
 * Custom hook for authentication state and user info
 */
export function useAuth() {
    const { data: session, status } = useSession()

    const isAuthenticated = status === 'authenticated'
    const isLoading = status === 'loading'

    const user = useMemo(() => {
        if (!session?.user) return null
        return {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
        }
    }, [session])

    return {
        user,
        isAuthenticated,
        isLoading,
        session,
    }
}
