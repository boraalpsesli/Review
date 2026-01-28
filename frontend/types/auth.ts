/**
 * Authentication-related types
 */

export interface User {
    id: string
    email: string
    name?: string
    image?: string
    firstName?: string
    lastName?: string
}

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    firstName?: string
    lastName?: string
}

export interface TokenResponse {
    access_token: string
    token_type: string
}
