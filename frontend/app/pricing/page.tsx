import Link from "next/link";
import { Check, Zap, Sparkles, Rocket } from "lucide-react";

export default function PricingPage() {
    const plans = [
        {
            name: "Monthly",
            price: "$49",
            period: "/mo",
            description: "Perfect for getting started and analyzing your current standing.",
            icon: Zap,
            features: [
                "Up to 10 Analyses",
                "Basic Sentiment Analysis",
                "Email support",
                "24h turnaround"
            ],
            color: "from-blue-500 to-cyan-400",
            buttonText: "Start Monthly",
            recommend: false
        },
        {
            name: "Quarterly",
            price: "$129",
            period: "/qtr",
            discount: "Save 12%",
            description: "Deep dive into trends and comprehensive competitor analysis.",
            icon: Sparkles,
            features: [
                "Unlimited Analyses",
                "Advanced AI Insights",
                "Competitor Tracking",
                "Priority support",
                "Custom PDF Reports"
            ],
            color: "from-purple-600 to-pink-500",
            buttonText: "Start Quarterly",
            recommend: true
        },
        {
            name: "Yearly",
            price: "$499",
            period: "/yr",
            discount: "Save 15%",
            description: "Maximum value for franchise owners and serious growth.",
            icon: Rocket,
            features: [
                "Everything in Quarterly",
                "API Access",
                "Dedicated Account Manager",
                "White-label Reports",
                "Quarterly Business Review"
            ],
            color: "from-orange-500 to-yellow-400",
            buttonText: "Start Yearly",
            recommend: false
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            {/* Navbar (Minimal) */}
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20"></div>
                        <span className="font-bold text-lg tracking-tight text-white">ReviewAI</span>
                    </Link>

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

            {/* Header */}
            <header className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                    Simple, transparent pricing
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Choose the plan that fits your growth stage. No hidden fees, cancel anytime.
                </p>

                {/* Toggle (Visual Only) */}
                <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10">
                    <button className="px-6 py-2 rounded-full bg-white/10 text-white font-medium text-sm transition-all shadow-lg">Monthly</button>
                    <button className="px-6 py-2 rounded-full text-gray-500 font-medium text-sm hover:text-gray-300 transition-all">Yearly (-20%)</button>
                </div>
            </header>

            {/* Plans Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`relative bg-black/40 backdrop-blur-xl border ${plan.recommend ? 'border-purple-500/50 shadow-2xl shadow-purple-900/40 transform md:-translate-y-4' : 'border-white/10'} rounded-3xl p-8 flex flex-col hover:border-white/20 transition-all duration-300 group`}
                        >
                            {plan.recommend && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <plan.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">{plan.description}</p>

                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-gray-500 mb-1">{plan.period}</span>
                                {plan.discount && (
                                    <span className="ml-auto text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded-full border border-green-500/20">
                                        {plan.discount}
                                    </span>
                                )}
                            </div>

                            <button className={`w-full py-3 rounded-xl font-bold text-sm mb-8 transition-all duration-200 ${plan.recommend
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/30'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}>
                                {plan.buttonText}
                            </button>

                            <div className="space-y-4 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto px-6 py-24 border-t border-white/10">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="font-bold text-lg mb-2">Can I cancel anytime?</h4>
                        <p className="text-gray-400 text-sm">Yes, absolutely. There are no contracts or hidden fees. You can cancel directly from your dashboard.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="font-bold text-lg mb-2">What happens to my data?</h4>
                        <p className="text-gray-400 text-sm">Your data is yours. If you cancel, you can export all your reports before your subscription ends.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="font-bold text-lg mb-2">Do you offer refunds?</h4>
                        <p className="text-gray-400 text-sm">We offer a 7-day money-back guarantee if you're not satisfied with your first analysis.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h4 className="font-bold text-lg mb-2">Can I switch plans?</h4>
                        <p className="text-gray-400 text-sm">Yes, you can upgrade or downgrade at any time. Prorated charges will apply automatically.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-gray-500">© 2026 InsightFlow. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
