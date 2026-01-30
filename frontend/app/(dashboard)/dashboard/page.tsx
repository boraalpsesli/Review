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
    const PAGE_SIZE = 6; // Slight increase for better grid feel
    const skip = (currentPage - 1) * PAGE_SIZE;

    const analysesPromise = getAnalyses(userId, skip, PAGE_SIZE);
    const statsPromise = getStats(userId, days);

    const [analysesData, stats] = await Promise.all([analysesPromise, statsPromise]);
    const { items: analyses, total } = analysesData;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-lg">
                        Track your restaurant's performance trends and manage your review analysis history in one place.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Time Range Filter */}
                    <div className="p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center">
                        {[7, 30].map((d) => (
                            <Link
                                key={d}
                                href={`/dashboard?days=${d}&page=${currentPage}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${days === d
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {d} Days
                            </Link>
                        ))}
                    </div>

                    <Link
                        href="/dashboard/analyze"
                        className="group flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transform hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        New Analysis
                    </Link>
                </div>
            </div>

            {/* Charts Section */}
            {stats && (
                <div className="relative z-10">
                    <DashboardCharts stats={stats} />
                </div>
            )}

            {/* Recent Activity Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Recent Analyses
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-400 font-normal">{total}</span>
                        </h2>
                    </div>
                    <div className="relative w-full sm:w-auto hover:w-full sm:hover:w-[300px] transition-all duration-300 group">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by restaurant name..."
                            className="w-full sm:w-[250px] group-hover:w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                                <th className="px-6 py-4 font-semibold">Restaurant</th>
                                <th className="px-6 py-4 font-semibold">Date Received</th>
                                <th className="px-6 py-4 font-semibold">Sentiment</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {analyses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                                <Search className="w-8 h-8" />
                                            </div>
                                            <div className="text-gray-500">No analyses found</div>
                                            <Link href="/dashboard/analyze" className="text-purple-400 hover:text-purple-300 font-medium text-sm">
                                                Start your first analysis &rarr;
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                analyses.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/5 group-hover:scale-110 transition-transform">
                                                    {(item.restaurant_name || "U")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{item.restaurant_name || "Unknown Restaurant"}</div>
                                                    <a
                                                        href={item.google_maps_url || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-gray-500 truncate max-w-[150px] block hover:text-purple-400 hover:underline"
                                                    >
                                                        View on Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.sentiment_score !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${item.sentiment_score > 0.5 ? "bg-green-500" :
                                                                item.sentiment_score > 0 ? "bg-yellow-500" : "bg-red-500"
                                                                }`}
                                                            style={{ width: `${((item.sentiment_score + 1) / 2) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold ${item.sentiment_score > 0.5 ? "text-green-400" :
                                                        item.sentiment_score > 0 ? "text-yellow-400" : "text-red-400"
                                                        }`}>
                                                        {item.sentiment_score.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${item.status === 'COMPLETED'
                                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                                                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                }`}>
                                                {item.status === 'COMPLETED' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5 animate-pulse" />}
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/analysis/${item.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white text-white hover:text-black text-xs font-bold border border-white/10 transition-all hover:scale-105 active:scale-95"
                                            >
                                                View Report
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
                    <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                        <div className="text-xs text-gray-500 font-medium">
                            Showing <span className="text-white">{skip + 1}-{Math.min(skip + PAGE_SIZE, total)}</span> of <span className="text-white">{total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard?days=${days}&page=${Math.max(1, currentPage - 1)}`}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${currentPage === 1
                                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
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
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === p
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {p}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={`/dashboard?days=${days}&page=${Math.min(totalPages, currentPage + 1)}`}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${currentPage === totalPages
                                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
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
