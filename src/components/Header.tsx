"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Wallet, Sparkles } from "lucide-react";

export default function Header() {
  const { user } = useApp();

  const nameToUse = user?.user_metadata?.full_name || 
                    user?.user_metadata?.name || 
                    user?.email || 
                    "Guest";
  const initial = nameToUse.charAt(0).toUpperCase();

  return (
    <header className="px-5 pt-6 pb-4 bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/80 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-950 text-sm tracking-tight">Prosper</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* User profile initials avatar link */}
      <Link 
        href="/profile"
        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        title="View Profile"
      >
        {initial}
      </Link>
    </header>
  );
}
