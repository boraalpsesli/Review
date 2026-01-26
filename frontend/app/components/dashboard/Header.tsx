import { auth } from "@/auth";

export default async function Header() {
    const session = await auth();

    return (
        <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
            <h2 className="text-xl font-semibold text-white">Dashboard</h2>
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-white">{session?.user?.name || "User"}</p>
                    <p className="text-xs text-gray-400">{session?.user?.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white/10">
                    {session?.user?.name?.[0] || "U"}
                </div>
            </div>
        </header>
    );
}
