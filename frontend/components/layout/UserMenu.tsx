"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"

interface UserMenuProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-zinc-300 hover:text-white group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-white/10">
                    <span className="text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </span>
                </div>
                <span className="hidden md:block max-w-[100px] truncate">
                    {user.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                        <p className="text-sm font-medium text-white truncate">{user.name || "User"}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>

                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}
