import Image from "next/image";
import AnalysisForm from "../components/AnalysisForm";
import Link from "next/link";
import { ArrowRight, Star, TrendingUp, ShieldCheck, Zap, BarChart3, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000212] flex flex-col overflow-hidden selection:bg-purple-500/30">

      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20"></div>
            <span className="font-bold text-lg tracking-tight text-white">ReviewAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">How it works</a>
            <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow">

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-300 mb-8 animate-fade-in">
              <span className="flex w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              2.0 is now live
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1] md:leading-[1.1] animate-fade-in">
              Customer insights, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-gradient-x">
                decoded by AI.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              Transform messy Google Maps reviews into actionable growth strategies.
              Identify trends, spot fake reviews, and outline improvements in seconds.
            </p>

            <div id="analysis-form" className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16 scroll-mt-24 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <AnalysisForm />
            </div>

            {/* Mock UI Showcase */}
            <div id="demo" className="relative mx-auto max-w-5xl rounded-xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-sm mx-4 scroll-mt-24">
              <div className="aspect-[16/9] rounded-lg bg-zinc-950 overflow-hidden relative group">
                {/* Fake Browser UI */}
                <div className="absolute top-0 w-full h-8 bg-zinc-900 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
                {/* Content Placeholder (Simulating Dashboard) */}
                <div className="mt-8 p-6 grid grid-cols-3 gap-6 h-full opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="col-span-2 space-y-4">
                    <div className="h-32 rounded-lg bg-white/5 border border-white/5 animate-pulse-slow"></div>
                    <div className="h-48 rounded-lg bg-white/5 border border-white/5"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-20 rounded-lg bg-purple-500/10 border border-purple-500/20"></div>
                    <div className="h-60 rounded-lg bg-white/5 border border-white/5"></div>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-medium shadow-2xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    Live Dashboard Preview
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-20 border-t border-white/5 pt-10">
              <p className="text-sm font-medium text-zinc-500 mb-6">TRUSTED BY INNOVATIVE TEAMS</p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-50">
                {/* Simulated Logos */}
                <div className="h-8 flex items-center font-bold text-xl text-white">Acme<span className="text-purple-500">Corp</span></div>
                <div className="h-8 flex items-center font-bold text-xl text-white">Linear<span className="text-indigo-500">Flow</span></div>
                <div className="h-8 flex items-center font-bold text-xl text-white">Turbo<span className="text-blue-500">List</span></div>
                <div className="h-8 flex items-center font-bold text-xl text-white">Rocket<span className="text-red-500">Dine</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Designed for speed & clarity</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                No more spreadsheets. Just clear, AI-driven insights delivered instantly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
              {/* Feature 1: Big Card */}
              <div className="md:col-span-2 row-span-1 rounded-3xl bg-zinc-900 border border-white/5 p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Instant Analysis</h3>
                  <p className="text-zinc-400 text-lg max-w-md">Paste any Google Maps URL and get a comprehensive report in under 60 seconds.</p>
                </div>
              </div>

              {/* Feature 2: Tall Card */}
              <div className="md:col-span-1 row-span-2 rounded-3xl bg-zinc-900 border border-white/5 p-8 relative overflow-hidden group hover:border-pink-500/30 transition-colors">
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-pink-500/10 blur-[100px] rounded-full group-hover:bg-pink-500/20 transition-all"></div>
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Competitor Tracking</h3>
                  <p className="text-zinc-400 mb-8">Monitor your local rivals. See what they're doing right (and wrong) to steal their market share.</p>

                  {/* Pseudo Graph */}
                  <div className="mt-auto flex items-end justify-between gap-2 h-32 px-4 pb-4 border-b border-white/10">
                    <div className="w-full bg-zinc-800 rounded-t-sm h-[40%] group-hover:h-[60%] transition-all duration-500"></div>
                    <div className="w-full bg-pink-900/40 rounded-t-sm h-[60%] group-hover:h-[40%] transition-all duration-500"></div>
                    <div className="w-full bg-pink-600 rounded-t-sm h-[80%] group-hover:h-[90%] transition-all duration-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Small Card */}
              <div className="md:col-span-1 row-span-1 rounded-3xl bg-zinc-900 border border-white/5 p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sentiment Shield</h3>
                <p className="text-zinc-400">Automatically flag negative sentiment trends before they impact your rating.</p>
              </div>

              {/* Feature 4: Small Card */}
              <div className="md:col-span-1 row-span-1 rounded-3xl bg-zinc-900 border border-white/5 p-8 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Team Access</h3>
                <p className="text-zinc-400">Share reports with your managers effortlessly. No per-seat pricing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/10 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to see clearly?</h2>
            <p className="text-xl text-zinc-400 mb-10">Join 500+ restaurants making data-driven decisions today.</p>
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Start your 14-day free trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/5 bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-800"></div>
            <span className="font-bold text-zinc-200">ReviewAI</span>
          </div>
          <p className="text-sm text-zinc-500">© 2026 ReviewAI Inc. Crafted with precision.</p>
          <div className="flex gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">GitHub</a>
            <a href="#" className="hover:text-white">Legal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
