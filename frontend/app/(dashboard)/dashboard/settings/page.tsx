"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Mail, Shield, Check, Building2, Store } from "lucide-react";
import { getUser } from "@/app/lib/api";
import { useSearchParams, useRouter } from "next/navigation";

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Real state for integrations
    const [gmbConnected, setGmbConnected] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        if (session?.user?.accessToken) {
            fetchUserData();
        }
    }, [session]);

    useEffect(() => {
        // Check for success param from backend redirect
        if (searchParams.get('google_connected') === 'true') {
            // Ideally show a toast here
            console.log("Google account connected successfully!");
            // Remove the param from URL without refresh
            router.replace('/dashboard/settings');
            // Force fetch data again to ensure state is fresh
            if (session?.user?.accessToken) fetchUserData();
        }
        if (searchParams.get('error')) {
            console.error("Google connection error:", searchParams.get('error'));
        }
    }, [searchParams, session]);

    const fetchUserData = async () => {
        try {
            // @ts-ignore
            const token = session?.user?.accessToken || session?.accessToken;
            if (!token) return;

            setLoading(true);
            const data = await getUser(token);
            setUserData(data);
            setGmbConnected(data.google_account_connected);
        } catch (error) {
            console.error("Failed to fetch user settings:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your account profile and integrations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Profile Settings (Left Column) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Profile Information</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">First Name</label>
                                    <input
                                        type="text"
                                        defaultValue={userData?.first_name || session?.user?.name?.split(" ")[0] || ""}
                                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Last Name</label>
                                    <input
                                        type="text"
                                        defaultValue={userData?.last_name || session?.user?.name?.split(" ").slice(1).join(" ") || ""}
                                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        defaultValue={session?.user?.email || ""}
                                        disabled
                                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/5 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Email address cannot be changed.</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Integrations (Right Column) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Integrations</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Google Business Profile Card */}
                            <div className={`p-5 rounded-xl border transition-colors group ${gmbConnected ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2">
                                        {/* Google Logo SVG */}
                                        <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gmbConnected ? 'bg-green-500/20 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                        {gmbConnected ? 'Connected' : 'Not Connected'}
                                    </div>
                                </div>

                                <h3 className="font-bold text-white mb-1">Google Business Profile</h3>
                                <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                                    {gmbConnected
                                        ? "Your account is connected. You can now use automated features."
                                        : "Connect your business capabilities to enable automated replies and verified ownership."
                                    }
                                </p>

                                {!gmbConnected ? (
                                    <button
                                        onClick={() => {
                                            const userId = session?.user?.id;
                                            // Ideally use env var for URL
                                            window.location.href = `http://localhost:8000/api/v1/auth/google/login?user_id=${userId}`;
                                        }}
                                        disabled={loading}
                                        className="w-full py-2.5 rounded-lg font-bold text-sm bg-white text-black hover:bg-gray-200 transition-all cursor-pointer"
                                    >
                                        Connect Account
                                    </button>
                                ) : (
                                    <button
                                        className="w-full py-2.5 rounded-lg font-bold text-sm bg-white/5 text-gray-400 cursor-not-allowed border border-white/5"
                                        disabled
                                    >
                                        Configuration Active
                                    </button>
                                )}
                            </div>

                            {/* Placeholder for future integrations */}
                            <div className="p-5 rounded-xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-gray-400 text-sm">Yelp Integration</h3>
                                </div>
                                <p className="text-gray-500 text-xs">Coming soon in future updates.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
