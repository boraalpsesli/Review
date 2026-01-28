/**
 * API client for backend communication
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
    token?: string
}

/**
 * Generic fetch wrapper with error handling and auth support
 */
async function fetchWithAuth<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { token, ...fetchOptions } = options

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
}

export const api = {
    get: <T>(endpoint: string, options?: FetchOptions) =>
        fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        fetchWithAuth<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        fetchWithAuth<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: <T>(endpoint: string, options?: FetchOptions) =>
        fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' }),
}
