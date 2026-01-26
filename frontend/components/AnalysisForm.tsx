"use client";

import { useState } from "react";

type AnalysisResult = {
    restaurant_name: string;
    sentiment_score: number;
    summary: string;
    complaints: string[];
    praises: string[];
    reviews_analyzed: number;
};

export default function AnalysisForm() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length < 3) {
            setError("Please enter a restaurant name and location (e.g., 'Nusr-Et Istanbul')");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);
        setStatus("Initiating analysis...");

        try {
            // 1. Submit Analysis Request
            const res = await fetch("http://localhost:8000/api/v1/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim() }),
            });

            if (!res.ok) throw new Error("Failed to start analysis");

            const data = await res.json();
            const taskId = data.task_id;
            setStatus("Searching and scraping reviews...");

            // 2. Poll for Status
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`http://localhost:8000/api/v1/status/${taskId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === "SUCCESS") {
                        clearInterval(pollInterval);
                        setResult(statusData.result);
                        setLoading(false);
                        setStatus("Complete!");
                    } else if (statusData.status === "FAILURE") {
                        clearInterval(pollInterval);
                        throw new Error(statusData.error || "Analysis failed");
                    } else {
                        // Update status message based on where we likely are
                        if (statusData.result) {
                            // Sometimes result comes partial? No, usually null if running
                        }
                        setStatus(`Processing... (${statusData.status})`);
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    setLoading(false);
                    setError(err instanceof Error ? err.message : "Error checking status");
                    console.error(err);
                }
            }, 2000);

        } catch (err) {
            setLoading(false);
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center gap-4 mb-8">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Restaurant name + location (e.g., Nusr-Et Istanbul)"
                    className="w-full h-14 pl-6 pr-4 rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg shadow-lg transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-8 rounded-xl bg-white text-black font-bold text-lg shadow-lg hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-purple-500/25 whitespace-nowrap cursor-pointer"
                >
                    {loading ? "Analyzing..." : "Analyze Now"}
                </button>
            </form>

            {error && (
                <div className="p-4 mb-6 rounded-lg bg-red-900/20 border border-red-500/20 text-red-300 text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}

            {loading && !result && (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-zinc-400 font-medium">{status}</p>
                </div>
            )}

            {result && (
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-8 text-left animate-slide-up">
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-white">{result.restaurant_name}</h3>
                            <p className="text-zinc-400 text-sm">Based on {result.reviews_analyzed} recent reviews</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-bold ${result.sentiment_score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(result.sentiment_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Sentiment Score</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Executive Summary</h4>
                        <p className="text-zinc-200 text-lg leading-relaxed">{result.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-green-900/10 rounded-xl p-6 border border-green-500/20">
                            <h4 className="flex items-center gap-2 text-green-400 font-bold mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                Success Factors
                            </h4>
                            <ul className="space-y-2">
                                {result.praises.map((praise, i) => (
                                    <li key={i} className="flex gap-2 text-green-200 text-sm">
                                        <span className="text-green-500">•</span> {praise}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-900/10 rounded-xl p-6 border border-red-500/20">
                            <h4 className="flex items-center gap-2 text-red-400 font-bold mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                                Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                                {result.complaints.map((complaint, i) => (
                                    <li key={i} className="flex gap-2 text-red-200 text-sm">
                                        <span className="text-red-500">•</span> {complaint}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
