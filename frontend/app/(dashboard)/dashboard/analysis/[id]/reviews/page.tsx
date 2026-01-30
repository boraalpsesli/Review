import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Star, Calendar } from "lucide-react";
import { notFound } from "next/navigation";
import ReviewImage from "@/components/ReviewImage";

// Interface matching Backend API response
interface Review {
    text: string;
    rating: number;
    author: string;
    date: string;
    profile_picture?: string;
    source: string;
}

interface ReviewListResponse {
    restaurant_name: string;
    total_reviews: number;
    reviews: Review[];
}

async function getReviews(id: string, userId: string, skip: number = 0, limit: number = 20) {
    // Try environment variable first
    let url = process.env.INTERNAL_API_URL;

    // If not set, try backend-api (Docker)
    if (!url) {
        url = "http://backend-api:8000";
    }

    try {
        console.log(`Fetching reviews from: ${url}/api/v1/analyses/${id}/reviews`);
        const res = await fetch(`${url}/api/v1/analyses/${id}/reviews?user_id=${userId}&skip=${skip}&limit=${limit}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error("Failed to fetch reviews:", await res.text());
            return null;
        }

        return await res.json() as ReviewListResponse;
    } catch (e) {
        console.error("Error fetching reviews from primary URL:", e);

        // Fallback for local development (if backend-api fails)
        if (!process.env.INTERNAL_API_URL && (url.includes("backend-api") || url.includes("host.docker.internal"))) {
            try {
                console.log("Attempting fallback to localhost:8000...");
                const fallbackUrl = "http://localhost:8000";
                const res = await fetch(`${fallbackUrl}/api/v1/analyses/${id}/reviews?user_id=${userId}&skip=${skip}&limit=${limit}`, {
                    cache: 'no-store',
                });

                if (res.ok) {
                    return await res.json() as ReviewListResponse;
                }
            } catch (fallbackError) {
                console.error("Fallback fetch failed:", fallbackError);
            }
        }
        return null; // Return null to indicate failure
    }
}

export default async function ReviewsPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ page?: string }>
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    const PAGE_SIZE = 10;
    const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;
    const skip = (currentPage - 1) * PAGE_SIZE;

    const userId = session.user.id;
    const data = await getReviews(params.id, userId, skip, PAGE_SIZE);



    if (!data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-400 mb-2">Could not load reviews</h2>
                <p className="text-gray-400">
                    There was an error connecting to the backend services. Please check if the backend is running.
                </p>
                <Link href={`/dashboard/analysis/${params.id}`} className="mt-4 inline-block text-purple-400 hover:text-purple-300">
                    &larr; Back to analysis
                </Link>
            </div>
        );
    }

    const totalPages = Math.ceil(data.total_reviews / PAGE_SIZE);


    return (
        <div className="space-y-8 pb-12 animate-fade-in">
            {/* 1. Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 py-10 backdrop-blur-md">
                <div className="absolute top-0 right-0 p-48 bg-purple-600/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4">
                        <Link
                            href={`/dashboard/analysis/${params.id}`}
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                        >
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Back to Analysis
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Review Explorer
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg">
                                Deep dive into what customers are really saying about <span className="text-white font-medium">{data.restaurant_name}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-black/20 p-2 pr-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 text-white font-bold text-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            {data.total_reviews > 99 ? '99+' : data.total_reviews}
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Analyzed</div>
                            <div className="text-white font-medium">{data.total_reviews} Reviews</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Reviews Masonry Grid */}
            <div className="columns-1 md:columns-2 gap-6 space-y-6 [column-fill:_balance]">
                {data.reviews.map((review, i) => (
                    <div key={i} className="break-inside-avoid bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] group backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <ReviewImage
                                    src={review.profile_picture}
                                    alt={review.author || "Reviewer"}
                                    authorName={review.author}
                                />
                                <div>
                                    <div className="font-bold text-zinc-200 text-sm group-hover:text-purple-300 transition-colors">
                                        {review.author || "Anonymous Reviewer"}
                                    </div>
                                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {review.date || "Unknown Date"}
                                    </div>
                                </div>
                            </div>

                            <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${review.rating >= 4
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : review.rating <= 2
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                }`}>
                                {review.rating} <Star className="w-3 h-3 fill-current" />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute top-0 left-0 -ml-2 -mt-2 text-4xl text-white/5 font-serif select-none pointer-events-none">“</div>
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                                {review.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {data.reviews.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/5 border border-dashed border-white/10">
                    <div className="p-4 rounded-full bg-white/5 mb-4">
                        <Star className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No reviews found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or scrape a different location.</p>
                </div>
            )}

            {/* 3. Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 py-6 border-t border-white/5">
                    <Link
                        href={`/dashboard/analysis/${params.id}/reviews?page=${Math.max(1, currentPage - 1)}`}
                        className={`h-10 px-5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${currentPage === 1 ? 'border-transparent text-gray-600 cursor-not-allowed' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
                        aria-disabled={currentPage === 1}
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </Link>

                    <div className="flex items-center gap-1.5 mx-4">
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            // Simple pagination logic for demo - can be improved for many pages
                            /* if (totalPages > 7 && Math.abs(currentPage - p) > 2 && p !== 1 && p !== totalPages) {
                                if (Math.abs(currentPage - p) === 3) return <span key={p} className="text-gray-600 px-1">...</span>;
                                return null;
                            } */

                            return (
                                <Link
                                    key={p}
                                    href={`/dashboard/analysis/${params.id}/reviews?page=${p}`}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === p
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-105'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {p}
                                </Link>
                            );
                        })}
                    </div>

                    <Link
                        href={`/dashboard/analysis/${params.id}/reviews?page=${Math.min(totalPages, currentPage + 1)}`}
                        className={`h-10 px-5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${currentPage === totalPages ? 'border-transparent text-gray-600 cursor-not-allowed' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
                        aria-disabled={currentPage === totalPages}
                    >
                        Next <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                </div>
            )}
        </div>
    );
}
