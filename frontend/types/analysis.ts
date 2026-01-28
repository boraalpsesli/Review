/**
 * Analysis and restaurant-related types
 */

export interface Restaurant {
    id: number
    name: string
    googleMapsUrl: string
    address?: string
    rating?: number
    totalReviews?: number
    createdAt: string
}

export interface AnalysisReport {
    id: number
    restaurantId: number
    taskId?: string
    userId?: string
    analysisDate: string
    sentimentScore?: number
    summary?: string
    complaints: string[]
    praises: string[]
    reviewsAnalyzed?: number
    rawAiResponse?: Record<string, unknown>
    createdAt: string
    restaurant?: Restaurant
}

export interface Analysis {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    taskId: string
    report?: AnalysisReport
    error?: string
}

export interface AnalysisRequest {
    googleMapsUrl: string
    depth?: 'quick' | 'standard' | 'deep'
}
