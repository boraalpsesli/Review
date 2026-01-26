import { auth } from "@/auth";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

// Types matching backend response
interface AnalysisHistoryItem {
    id: int;
    restaurant_name: string | null;
    sentiment_score: number | null;
    summary: string | null;
    created_at: string;
    status: string;
    google_maps_url: string | null;
}

async function getAnalyses(userId: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://backend-api:8000"; // Use internal docker name for server-side
    // Note: In dev with docker, internal fetches need to use service name 'backend-api' 
    // but typically we configure this via env vars.
    // However, NEXT_PUBLIC_API_URL represents client-side URL. 
    // For server-side fetch inside docker, we might need a separate var or fallback.

    // Fallback logic for Docker environment if not set
    const url = process.env.INTERNAL_API_URL || "http://backend-api:8000";

    try {
        const res = await fetch(`${url}/api/v1/analyses?user_id=${userId}&limit=10`, {
            cache: 'no-store', // Always fetch fresh
            next: { tags: ['analyses'] }
        });

        if (!res.ok) {
            console.error("Failed to fetch analyses:", await res.text());
            return [];
        }

        return await res.json() as AnalysisHistoryItem[];
    } catch (e) {
        console.error("Error fetching analyses:", e);
        return [];
    }
}

export default async function DashboardPage() {
    const session = await auth();

    // Safe guard: Middleware should protect this, but good to check
    if (!session?.user?.id) return null; // Or redirect

    // Use a hardcoded ID for demo if auth provider doesn't return numeric ID yet
    // In real implementation, session.user.id would be the DB ID.
    const userId = session.user.id || "1";

    const analyses = await getAnalyses(userId);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 mt-1">Manage and view your restaurant review analyses.</p>
                </div>
                <Link
                    href="/#analysis-form"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 transform hover:-translate-y-0.5"
                >
                    <PlusCircle className="w-5 h-5" />
                    New Analysis
                </Link>
            </div>

            {/* Stats - Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium">Total Analyses</h3>
                    <p className="text-3xl font-bold text-white mt-2">{analyses.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium">Avg Sentiment</h3>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                        {analyses.length > 0
                            ? (analyses.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0) / analyses.length).toFixed(2)
                            : "N/A"
                        }
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium">Plan Usage</h3>
                    <p className="text-3xl font-bold text-purple-400 mt-2">{analyses.length} / 50</p>
                </div>
            </div>

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
            </div>
        </div>
    );
}
