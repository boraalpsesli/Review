"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";


type PlaceInfo = {
    title: string;
    address: string;
    rating: number;
    review_count: number;
    category: string;
    link: string;
    thumbnail: string;
};

// ... (existing code)



type RecommendedAction = {
    title: string;
    description: string;
};

type AnalysisResult = {
    restaurant_name: string;
    sentiment_score: number;
    summary: string;
    complaints: string[];
    praises: string[];
    recommended_actions: RecommendedAction[];
    reviews_analyzed: number;
};

export default function AnalysisForm() {
    const { data: session } = useSession();
    const router = useRouter();
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
                        setLoading(false);
                        setStatus("Complete!");
                        // Redirect to the detail page (which uses the new design)
                        router.push(`/dashboard/analysis/${statusData.result.id}`);
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
                                    {place.thumbnail ? (
                                        <div className="relative w-16 h-16 shrink-0">
                                            <img
                                                src={place.thumbnail}
                                                alt={place.title}
                                                className="w-full h-full rounded-lg object-cover bg-zinc-700"
                                                onError={(e) => {
                                                    e.currentTarget.style.opacity = '0';
                                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="fallback-icon hidden absolute inset-0 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                                                <Store className="w-8 h-8 text-zinc-600" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
                                            <Store className="w-8 h-8 text-zinc-600" />
                                        </div>
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
                            {selectedPlace.thumbnail ? (
                                <div className="relative w-20 h-20 shrink-0">
                                    <img
                                        src={selectedPlace.thumbnail}
                                        alt={selectedPlace.title}
                                        className="w-full h-full rounded-xl object-cover bg-zinc-700"
                                        onError={(e) => {
                                            e.currentTarget.style.opacity = '0';
                                            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="fallback-icon hidden absolute inset-0 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10">
                                        <Store className="w-10 h-10 text-zinc-600" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-20 h-20 shrink-0 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10">
                                    <Store className="w-10 h-10 text-zinc-600" />
                                </div>
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
        </div>
    );
}
