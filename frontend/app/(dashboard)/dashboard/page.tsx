import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Search, Calendar } from "lucide-react";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

// Types matching backend response
interface AnalysisHistoryItem {
    id: number;
    restaurant_name: string | null;
    sentiment_score: number | null;
    summary: string | null;
    created_at: string;
    status: string;
    google_maps_url: string | null;
}

interface DashboardStats {
    total_analyzed: number;
    avg_sentiment: number;
    sentiment_trend: {
        date: string;
        volume: number;
        avg_sentiment: number;
    }[];
    sentiment_distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

interface AnalysisHistoryResponse {
    items: AnalysisHistoryItem[];
    total: number;
}

async function getAnalyses(userId: string, skip: number = 0, limit: number = 5) {
    const apiUrl = process.env.INTERNAL_API_URL || "http://backend-api:8000";
    try {
        const res = await fetch(`${apiUrl}/api/v1/analyses?user_id=${userId}&skip=${skip}&limit=${limit}`, {
            cache: 'no-store',
            next: { tags: ['analyses'] }
        });
        if (!res.ok) return { items: [], total: 0 };
        return await res.json() as AnalysisHistoryResponse;
    } catch (e) {
        console.error("Error fetching analyses:", e);
        return { items: [], total: 0 };
    }
}

async function getStats(userId: string, days: number = 30) {
    const apiUrl = process.env.INTERNAL_API_URL || "http://backend-api:8000";
    try {
        const res = await fetch(`${apiUrl}/api/v1/analyses/stats?user_id=${userId}&days=${days}`, {
            cache: 'no-store',
            next: { tags: ['stats'] }
        });
        if (!res.ok) return null;
        return await res.json() as DashboardStats;
    } catch (e) {
        console.error("Error fetching stats:", e);
        return null;
    }
}

export default async function DashboardPage(props: {
    searchParams: Promise<{ days?: string; page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id || "1";
    const days = searchParams.days ? parseInt(searchParams.days) : 30;
    const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;
    const PAGE_SIZE = 5;
    const skip = (currentPage - 1) * PAGE_SIZE;

    const analysesPromise = getAnalyses(userId, skip, PAGE_SIZE);
    const statsPromise = getStats(userId, days);

    const [analysesData, stats] = await Promise.all([analysesPromise, statsPromise]);
    const { items: analyses, total } = analysesData;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 mt-1">Manage and view your restaurant review analyses.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Filter */}
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                        <Link
                            href={`/dashboard?days=7&page=${currentPage}`}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${days === 7 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            7 Days
                        </Link>
                        <Link
                            href={`/dashboard?days=30&page=${currentPage}`}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${days === 30 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            30 Days
                        </Link>
                    </div>

                    <Link
                        href="/dashboard/analyze"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 transform hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-5 h-5" />
                        New Analysis
                    </Link>
                </div>
            </div>

            {/* Charts Section */}
            {stats && <DashboardCharts stats={stats} />}

            {/* Recent Activity Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
                                <th className="px-6 py-4 font-medium">Restaurant</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Score</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {analyses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No analyses found. Start your first analysis!
                                    </td>
                                </tr>
                            ) : (
                                analyses.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{item.restaurant_name || "Unknown Restaurant"}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.google_maps_url}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.sentiment_score !== null ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.sentiment_score > 0.5 ? "bg-green-500/10 text-green-400" :
                                                    item.sentiment_score > 0 ? "bg-yellow-500/10 text-yellow-400" :
                                                        "bg-red-500/10 text-red-400"
                                                    }`}>
                                                    {item.sentiment_score.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'COMPLETED' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/dashboard/analysis/${item.id}`}
                                                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/5">
                        <div className="text-xs text-gray-500">
                            Showing <span className="text-gray-300">{skip + 1}</span> to <span className="text-gray-300">{Math.min(skip + PAGE_SIZE, total)}</span> of <span className="text-gray-300">{total}</span> analyses
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard?days=${days}&page=${Math.max(1, currentPage - 1)}`}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${currentPage === 1 ? 'border-white/5 text-gray-600 cursor-not-allowed' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                aria-disabled={currentPage === 1}
                                tabIndex={currentPage === 1 ? -1 : undefined}
                            >
                                Previous
                            </Link>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <Link
                                        key={p}
                                        href={`/dashboard?days=${days}&page=${p}`}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${currentPage === p ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    >
                                        {p}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={`/dashboard?days=${days}&page=${Math.min(totalPages, currentPage + 1)}`}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${currentPage === totalPages ? 'border-white/5 text-gray-600 cursor-not-allowed' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                aria-disabled={currentPage === totalPages}
                                tabIndex={currentPage === totalPages ? -1 : undefined}
                            >
                                Next
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
