"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type PlaceInfo = {
    title: string;
    address: string;
    rating: number;
    review_count: number;
    category: string;
    link: string;
    thumbnail: string;
};

type AnalysisResult = {
    restaurant_name: string;
    sentiment_score: number;
    summary: string;
    complaints: string[];
    praises: string[];
    recommended_actions: string[];
    reviews_analyzed: number;
};

export default function AnalysisForm() {
    const { data: session } = useSession();
    const [query, setQuery] = useState("");
    const [places, setPlaces] = useState<PlaceInfo[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");

    // Step 1: Search for places
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length < 2) {
            setError("Please enter at least 2 characters");
            return;
        }

        setSearching(true);
        setError("");
        setPlaces([]);
        setSelectedPlace(null);
        setResult(null);

        try {
            const res = await fetch("http://localhost:8000/api/v1/places/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim(), limit: 5 }),
            });

            if (!res.ok) throw new Error("Search failed");

            const data = await res.json();
            setPlaces(data.places || []);

            if (data.places?.length === 0) {
                setError("No places found. Try a different search.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
        } finally {
            setSearching(false);
        }
    };

    // Step 2: Select a place
    const handleSelectPlace = (place: PlaceInfo) => {
        setSelectedPlace(place);
        setPlaces([]); // Hide the list after selection
    };

    // Step 3: Analyze the selected place
    const handleAnalyze = async () => {
        if (!selectedPlace) return;

        setLoading(true);
        setError("");
        setResult(null);
        setStatus("Initiating analysis...");

        try {
            const res = await fetch("http://localhost:8000/api/v1/places/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    place_url: selectedPlace.link,
                    place_name: selectedPlace.title,
                    user_id: session?.user?.id || null // Pass user ID
                }),
            });

            if (!res.ok) throw new Error("Failed to start analysis");

            const data = await res.json();
            const taskId = data.task_id;
            setStatus("Scraping reviews...");

            // Poll for status
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
                        setStatus(`Processing... (${statusData.status})`);
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    setLoading(false);
                    setError(err instanceof Error ? err.message : "Error checking status");
                }
            }, 2000);

        } catch (err) {
            setLoading(false);
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    // Reset to search again
    const handleReset = () => {
        setSelectedPlace(null);
        setPlaces([]);
        setResult(null);
        setError("");
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Search Form */}
            {!selectedPlace && (
                <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search restaurant (e.g., McDonald's Kadıköy)"
                        className="w-full h-14 pl-6 pr-4 rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg shadow-lg transition-all"
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="h-14 px-8 rounded-xl bg-white text-black font-bold text-lg shadow-lg hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
                    >
                        {searching ? "Searching..." : "Search"}
                    </button>
                </form>
            )}

            {/* Loading Spinner for Search */}
            {searching && (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
                    <p className="mt-4 text-zinc-400 font-medium">Searching places...</p>
                </div>
            )}

            {/* Place Results */}
            {places.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
                        Select a place ({places.length} found)
                    </h3>
                    <div className="space-y-3">
                        {places.map((place, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectPlace(place)}
                                className="w-full text-left p-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-purple-500/50 hover:bg-zinc-800 transition-all group cursor-pointer"
                            >
                                <div className="flex items-start gap-4">
                                    {place.thumbnail && (
                                        <img
                                            src={place.thumbnail}
                                            alt={place.title}
                                            className="w-16 h-16 rounded-lg object-cover bg-zinc-700"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-white font-semibold group-hover:text-purple-300 transition-colors">
                                            {place.title}
                                        </h4>
                                        <p className="text-zinc-400 text-sm">{place.address}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            {place.rating > 0 && (
                                                <span className="flex items-center gap-1 text-yellow-400">
                                                    ⭐ {place.rating.toFixed(1)}
                                                </span>
                                            )}
                                            {place.review_count > 0 && (
                                                <span className="text-zinc-500">
                                                    {place.review_count.toLocaleString()} reviews
                                                </span>
                                            )}
                                            {place.category && (
                                                <span className="text-zinc-500">{place.category}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        →
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Place */}
            {selectedPlace && !result && (
                <div className="mb-8 p-6 rounded-2xl bg-zinc-800/50 border border-purple-500/30">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {selectedPlace.thumbnail && (
                                <img
                                    src={selectedPlace.thumbnail}
                                    alt={selectedPlace.title}
                                    className="w-20 h-20 rounded-xl object-cover bg-zinc-700"
                                />
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedPlace.title}</h3>
                                <p className="text-zinc-400">{selectedPlace.address}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                    {selectedPlace.rating > 0 && (
                                        <span className="flex items-center gap-1 text-yellow-400">
                                            ⭐ {selectedPlace.rating.toFixed(1)}
                                        </span>
                                    )}
                                    {selectedPlace.review_count > 0 && (
                                        <span className="text-zinc-400">
                                            {selectedPlace.review_count.toLocaleString()} reviews
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="text-zinc-400 hover:text-white text-sm underline cursor-pointer"
                        >
                            Change
                        </button>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            {loading ? "Analyzing..." : "Analyze Reviews"}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 mb-6 rounded-lg bg-red-900/20 border border-red-500/20 text-red-300 text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}

            {/* Loading State for Analysis */}
            {loading && !result && (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
                    <p className="mt-4 text-zinc-400 font-medium">{status}</p>
                </div>
            )}

            {/* Analysis Result */}
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412-.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
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

                    {result.recommended_actions && result.recommended_actions.length > 0 && (
                        <div className="mt-8 bg-blue-900/10 rounded-xl p-6 border border-blue-500/20">
                            <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Recommended Actions
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.recommended_actions.map((action, i) => (
                                    <div key={i} className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                                        <span className="text-blue-500 font-bold">{i + 1}.</span>
                                        <p className="text-blue-100 text-sm leading-relaxed">{action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleReset}
                            className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                        >
                            ← Analyze another restaurant
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
