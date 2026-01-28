import AnalysisForm from "@/components/AnalysisForm";

export default function AnalyzePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">New Analysis</h1>
                <p className="text-gray-400 mt-1">
                    Enter a Google Maps URL to analyze reviews and get AI-powered insights.
                </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                <AnalysisForm />
            </div>
        </div>
    );
}
