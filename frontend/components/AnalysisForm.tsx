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
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.includes("google.com/maps")) {
            setError("Please enter a valid Google Maps URL");
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
                body: JSON.stringify({ google_maps_url: url }),
            });

            if (!res.ok) throw new Error("Failed to start analysis");

            const data = await res.json();
            const taskId = data.task_id;
            setStatus("Scraping reviews...");

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
                    setError("Error checking status");
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
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste Google Maps URL here..."
                    className="w-full h-14 pl-6 pr-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cta text-lg shadow-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-8 rounded-xl bg-cta text-white font-semibold text-lg shadow-lg hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                    {loading ? "Analyzing..." : "Analyze Now"}
                </button>
            </form>

            {error && (
                <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}

            {loading && !result && (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cta border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-secondary font-medium">{status}</p>
                </div>
            )}

            {result && (
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl p-8 text-left animate-slide-up">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-200/50 pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-primary">{result.restaurant_name}</h3>
                            <p className="text-secondary text-sm">Based on {result.reviews_analyzed} recent reviews</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-bold ${result.sentiment_score > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {(result.sentiment_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-secondary uppercase font-bold tracking-wider">Sentiment Score</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Executive Summary</h4>
                        <p className="text-primary text-lg leading-relaxed">{result.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
                            <h4 className="flex items-center gap-2 text-green-700 font-bold mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                Success Factors
                            </h4>
                            <ul className="space-y-2">
                                {result.praises.map((praise, i) => (
                                    <li key={i} className="flex gap-2 text-green-900 text-sm">
                                        <span className="text-green-500">•</span> {praise}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
                            <h4 className="flex items-center gap-2 text-red-700 font-bold mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                                Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                                {result.complaints.map((complaint, i) => (
                                    <li key={i} className="flex gap-2 text-red-900 text-sm">
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
