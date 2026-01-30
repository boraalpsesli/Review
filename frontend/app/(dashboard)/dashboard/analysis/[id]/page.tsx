import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Star, Calendar, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

// Interface matching Backend API response
interface AnalysisResult {
    id: number;
    restaurant_name: string;
    google_maps_url: string;
    sentiment_score: number;
    summary: string;
    complaints: string[];
    praises: string[];
    recommended_actions: { title: string; description: string }[];
    reviews_analyzed: number;
    created_at: string;
    status: string;
}

async function getAnalysis(id: string, userId: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://backend-api:8000"; // Docker service name
    const url = process.env.INTERNAL_API_URL || "http://backend-api:8000";

    try {
        const res = await fetch(`${url}/api/v1/analyses/${id}?user_id=${userId}`, {
            cache: 'no-store',
        });

        if (res.status === 404) return null;
        if (!res.ok) {
            console.error("Failed to fetch analysis:", await res.text());
            return null;
        }

        return await res.json() as AnalysisResult;
    } catch (e) {
        console.error("Error fetching analysis:", e);
        return null;
    }
}

export default async function AnalysisDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id || "1";
    const analysis = await getAnalysis(params.id, userId);

    if (!analysis) {
        notFound();
    }

    const sentimentPercent = (analysis.sentiment_score * 100).toFixed(0);
    const isPositive = analysis.sentiment_score > 0;
    const sentimentColor = isPositive ? "text-green-400" : "text-red-400";
    const sentimentBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";
    const sentimentBorder = isPositive ? "border-green-500/20" : "border-red-500/20";

    return (
        <div className="space-y-8 pb-12 animate-fade-in">
            {/* 1. Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 md:p-10 backdrop-blur-md">
                <div className="absolute top-0 right-0 p-48 bg-purple-600/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 p-32 bg-blue-600/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${analysis.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                                {analysis.status}
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
                            {analysis.restaurant_name}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(analysis.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                            <a
                                href={analysis.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-purple-400 transition-colors flex items-center gap-1"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View on Maps
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link
                            href={`/dashboard/analysis/${analysis.id}/reviews`}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>Read Reviews</span>
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                {analysis.reviews_analyzed}
                            </div>
                        </Link>
                        <button className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all">
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Metrics & Analysis (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 2. Sentiment Scorecard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`rounded-2xl p-6 border ${sentimentBorder} ${sentimentBg} relative overflow-hidden flex flex-col justify-between min-h-[160px]`}>
                            <div className="absolute top-0 right-0 p-16 bg-current opacity-5 blur-[60px] rounded-full pointer-events-none"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`text-lg font-semibold ${sentimentColor} mb-1`}>Sentiment Score</h3>
                                    <p className="text-gray-400 text-sm">Overall customer satisfaction</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-white/5 backdrop-blur-sm ${sentimentColor}`}>
                                    {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className={`text-5xl font-bold tracking-tight ${sentimentColor}`}>{sentimentPercent}%</span>
                            </div>
                        </div>

                        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Executive Summary</h3>
                                <p className="text-gray-400 text-sm italic opacity-80 line-clamp-4 leading-relaxed">
                                    &ldquo;{analysis.summary}&rdquo;
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Detailed Insights */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Success Factors */}
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Success Factors</h3>
                            </div>
                            <div className="space-y-3 flex-1">
                                {analysis.praises?.map((praise, i) => (
                                    <div key={i} className="flex gap-3 text-gray-300 text-sm leading-relaxed p-3 rounded-xl hover:bg-white/5 transition-colors">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {praise}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Areas for Improvement */}
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Areas for Improvement</h3>
                            </div>
                            <div className="space-y-3 flex-1">
                                {analysis.complaints?.map((complaint, i) => (
                                    <div key={i} className="flex gap-3 text-gray-300 text-sm leading-relaxed p-3 rounded-xl hover:bg-white/5 transition-colors">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {complaint}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Strategy Deck (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-1">
                        <div className="rounded-[22px] bg-[#0A0A0A]/80 backdrop-blur-xl p-6 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Action Plan</h3>
                                    <p className="text-xs text-gray-500">AI-Recommended Steps</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {analysis.recommended_actions?.length > 0 ? (
                                    analysis.recommended_actions.map((action: any, i: number) => {
                                        const isObject = typeof action === 'object' && action !== null;
                                        const title = isObject ? action.title : `Action ${i + 1}`;
                                        const description = isObject ? action.description : action;

                                        return (
                                            <div key={i} className="group relative pl-4 pb-4 last:pb-0">
                                                {/* Timeline Line */}
                                                {i !== analysis.recommended_actions.length - 1 && (
                                                    <div className="absolute left-[7px] top-8 bottom-0 w-px bg-white/10 group-hover:bg-purple-500/30 transition-colors"></div>
                                                )}

                                                <div className="relative">
                                                    <div className="absolute -left-4 top-1 w-4 h-4 rounded-full border-2 border-[#0A0A0A] bg-purple-500/20 text-purple-400 flex items-center justify-center text-[8px] font-bold z-10 group-hover:bg-purple-500 group-hover:text-white transition-all ring-4 ring-[#0A0A0A]">
                                                        {i + 1}
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all">
                                                        <h4 className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-white transition-colors">
                                                            {title}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 leading-relaxed">
                                                            {description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 text-sm">No recommendations available</p>
                                    </div>
                                )}
                            </div>

                            <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-white/20 text-gray-400 text-sm hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-500/5 transition-all">
                                Export Action Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
