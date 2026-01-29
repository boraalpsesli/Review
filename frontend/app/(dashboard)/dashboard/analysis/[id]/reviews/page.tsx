import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Star, Calendar, User } from "lucide-react";
import { notFound } from "next/navigation";

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
    const url = process.env.INTERNAL_API_URL || "http://backend-api:8000";

    try {
        const res = await fetch(`${url}/api/v1/analyses/${id}/reviews?user_id=${userId}&skip=${skip}&limit=${limit}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error("Failed to fetch reviews:", await res.text());
            return null;
        }

        return await res.json() as ReviewListResponse;
    } catch (e) {
        console.error("Error fetching reviews:", e);
        return null;
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
        notFound();
    }

    const totalPages = Math.ceil(data.total_reviews / PAGE_SIZE);


    return (
        <div className="space-y-8 pb-12">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/analysis/${params.id}`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Raw Reviews
                        <span className="text-sm px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">
                            {data.total_reviews} total
                        </span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Scraped from Google Maps for <span className="text-white font-medium">{data.restaurant_name}</span>
                    </p>
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 gap-4">
                {data.reviews.map((review, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {review.profile_picture ? (
                                    <img
                                        src={review.profile_picture}
                                        alt={review.author}
                                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ${review.profile_picture ? 'hidden' : ''}`}>
                                    {review.author?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="font-medium text-white text-sm">{review.author || "Anonymous"}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {review.date || "Unknown Date"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded text-yellow-500 font-bold text-sm">
                                {review.rating} <Star className="w-3 h-3 fill-current" />
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {review.text}
                        </p>
                    </div>
                ))}

                {data.reviews.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No raw reviews found for this analysis.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <Link
                        href={`/dashboard/analysis/${params.id}/reviews?page=${Math.max(1, currentPage - 1)}`}
                        className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed text-gray-600' : 'hover:bg-white/10 text-white'}`}
                        aria-disabled={currentPage === 1}
                    >
                        Previous
                    </Link>

                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            // Only show current page, some before and some after if there are many?
                            // For simplicity, showing all for now since it's only 100 reviews (5 pages)
                            return (
                                <Link
                                    key={p}
                                    href={`/dashboard/analysis/${params.id}/reviews?page=${p}`}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${currentPage === p ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {p}
                                </Link>
                            );
                        })}
                    </div>

                    <Link
                        href={`/dashboard/analysis/${params.id}/reviews?page=${Math.min(totalPages, currentPage + 1)}`}
                        className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed text-gray-600' : 'hover:bg-white/10 text-white'}`}
                        aria-disabled={currentPage === totalPages}
                    >
                        Next
                    </Link>
                </div>
            )}
        </div>
    );
}
