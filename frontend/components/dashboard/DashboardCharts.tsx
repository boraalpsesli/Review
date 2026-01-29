"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";
import { TrendingUp, Users, MessageSquare } from "lucide-react";

interface DashboardStats {
    total_analyzed: number;
    avg_sentiment: number;
    sentiment_trend: {
        date: string;
        volume: number;
        avg_sentiment: number;
    }[];
    sentiment_distribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

export default function DashboardCharts({ stats }: { stats: DashboardStats }) {
    if (!stats) return null;

    const distributionData = [
        { name: "Positive", value: stats.sentiment_distribution.positive, color: "#4ade80" },
        { name: "Neutral", value: stats.sentiment_distribution.neutral, color: "#facc15" },
        { name: "Negative", value: stats.sentiment_distribution.negative, color: "#f87171" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Total Analyzed</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.total_analyzed}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Avg Sentiment</p>
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {(stats.avg_sentiment * 100).toFixed(0)}%
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Reviews Processed</p>
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {stats.sentiment_trend.reduce((acc, curr) => acc + curr.volume, 0)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-6">Sentiment Over Time</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.sentiment_trend}>
                                <defs>
                                    <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickFormatter={(val) => val.slice(5, 10)} // Show MM-DD
                                />
                                <YAxis stroke="#9ca3af" fontSize={12} domain={[-1, 1]} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg shadow-xl">
                                                    <p className="text-white font-medium mb-1">{data.restaurant_name}</p>
                                                    <p className="text-gray-400 text-xs mb-2">{new Date(data.date).toLocaleString()}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${data.avg_sentiment > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className="text-white font-bold">{(data.avg_sentiment * 100).toFixed(0)}% Sentiment</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="linear"
                                    dataKey="avg_sentiment"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSentiment)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Bar Chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-6">Sentiment Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
