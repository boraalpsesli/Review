import Link from "next/link";
import { LayoutDashboard, History, Settings, LogOut, PlusCircle } from "lucide-react";
import { signOut } from "@/auth";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/dashboard", icon: History }, // Placeholder
    { name: "Settings", href: "/dashboard", icon: Settings }, // Placeholder
];

export default function Sidebar() {
    return (
        <div className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col h-full bg-gradient-to-br from-gray-900/50 to-black/50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Insight<span className="text-white">Flow</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all group"
                    >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform text-purple-400" />
                        <span className="font-medium">{item.name}</span>
                    </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-white/10">
                    <Link
                        href="/#analysis-form"
                        className="flex items-center gap-3 px-4 py-3 text-purple-300 hover:bg-purple-500/20 hover:text-purple-100 rounded-xl transition-all group"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">New Analysis</span>
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-white/10">
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                    }}
                >
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group cursor-pointer">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
