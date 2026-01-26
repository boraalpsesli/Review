import Image from "next/image";
import AnalysisForm from "../components/AnalysisForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {/* Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl border border-white/20 bg-white/70 px-6 py-4 backdrop-blur-xl shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cta gradient-to-br from-blue-500 to-cta shadow-md"></div>
            <span className="text-xl font-bold tracking-tight text-primary">ReviewAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary">
            <a href="#features" className="hover:text-cta transition-colors">Features</a>
            <a href="#reviews" className="hover:text-cta transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-cta transition-colors">Pricing</a>
          </div>
          <button className="hidden md:block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-[100px] -z-10"></div>

        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-cta animate-ping"></span>
            <span className="text-xs font-semibold text-cta uppercase tracking-wide">AI-Powered Insights</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-primary sm:text-7xl mb-6">
            Turn Restaurant Reviews into <span className="text-cta">Revenue</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-secondary mb-10 leading-relaxed">
            Automatically analyze customer feedback from Google Maps, Yelp, and more.
            Get actionable insights to improve your service and boost your ratings.
          </p>

          <AnalysisForm />

          {/* Social Proof / Aggregate Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 block overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <div className="flex text-yellow-400">★★★★★</div>
              <span>Trusted by 500+ restaurants</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Sentiment Analysis", desc: "Understand exactly how customers feel about your food, service, and ambiance." },
              { title: "Review Aggregation", desc: "Pull reviews from Google, Yelp, and TripAdvisor into one unified dashboard." },
              { title: "Competitor Tracking", desc: "See how you stack up against local competitors and identify their weaknesses." },
            ].map((feature, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/40 p-8 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white/60 hover:shadow-xl hover:-translate-y-1 hover:border-white/60 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-xl font-bold text-primary mb-3 relative z-10">{feature.title}</h3>
                <p className="text-secondary leading-relaxed relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center shadow-2xl">
            <div className="absolute top-0 left-0 h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"></div>

            <h2 className="relative z-10 mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white mb-6">
              Ready to upgrade your restaurant's reputation?
            </h2>
            <p className="relative z-10 mx-auto max-w-lg text-lg text-slate-300 mb-10">
              Join hundreds of restaurants using ReviewAI to turn feedback into growth.
            </p>
            <button className="relative z-10 h-14 rounded-xl bg-white px-8 text-lg font-bold text-primary shadow-xl hover:bg-blue-50 hover:scale-105 transition-all duration-200 cursor-pointer">
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 backdrop-blur-md py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-secondary">
          <p>© 2026 Restaurant Review SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
