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

export default async function AnalysisDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return null;

    // In real app, use actual user ID. For demo, we might fall back to "1" if needed, 
    // but strict security is better.
    const userId = session.user.id || "1";

    const analysis = await getAnalysis(params.id, userId);

    if (!analysis) {
        notFound();
    }

    const sentimentPercent = (analysis.sentiment_score * 100).toFixed(0);
    const isPositive = analysis.sentiment_score > 0;

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {analysis.restaurant_name}
                        {analysis.status === 'COMPLETED' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Completed</span>
                        )}
                    </h1>
                    <a
                        href={analysis.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 transition-colors"
                    >
                        View on Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Sentiment Score</h3>
                    <div className={`text-4xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'} flex items-baseline gap-2`}>
                        {sentimentPercent}%
                        <span className="text-sm font-normal text-gray-500">
                            {isPositive ? <TrendingUp className="w-4 h-4 text-green-500/50" /> : <TrendingDown className="w-4 h-4 text-red-500/50" />}
                        </span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Reviews Analyzed</h3>
                    <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                        {analysis.reviews_analyzed}
                        <span className="text-sm font-normal text-gray-500">reviews</span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Date Analyzed</h3>
                    <div className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-center">
                    <button className="w-full h-full border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-purple-500/50 hover:text-purple-400 hover:bg-purple-500/5 transition-all">
                        <span className="font-medium text-sm">Download Report</span>
                        <span className="text-xs mt-1">PDF / CSV</span>
                    </button>
                </div>
            </div>

            {/* Main Content: Summary & Specifics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Executive Summary */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-purple-600/10 blur-[100px] rounded-full -z-10"></div>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                            Executive Summary
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-lg prose prose-invert max-w-none">
                            {analysis.summary}
                        </div>
                    </div>

                    {/* Complaints & Praises Split */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Praises */}
                        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Success Factors
                            </h3>
                            <ul className="space-y-3">
                                {analysis.praises?.map((praise, i) => (
                                    <li key={i} className="flex gap-3 text-green-200/80 text-sm bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {praise}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Complaints */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Areas for Improvement
                            </h3>
                            <ul className="space-y-3">
                                {analysis.complaints?.map((complaint, i) => (
                                    <li key={i} className="flex gap-3 text-red-200/80 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {complaint}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recommendations / Actions (Placeholder for future features) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">AI Recommendations</h3>
                        <p className="text-gray-400 text-sm mb-6">Based on this analysis, here are suggested actions to improve your score.</p>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="font-medium text-purple-300 text-sm mb-1">Reply to recent negative reviews</h4>
                                <p className="text-xs text-gray-500">Address the "slow service" complaints mentions in 3 recent reviews.</p>
                                <button className="mt-3 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors">Draft Reply</button>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h4 className="font-medium text-purple-300 text-sm mb-1">Highlight "Pasta" in menu</h4>
                                <p className="text-xs text-gray-500">Your pasta dishes are receiving high praise. Feature them more.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
