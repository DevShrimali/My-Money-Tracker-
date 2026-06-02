"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Wallet, TrendingUp, Plus, List, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { setIsModalOpen } = useApp();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[480px] w-full bg-white/95 backdrop-blur-md border-t border-slate-100/90 py-2.5 px-4 flex items-center justify-around z-30 shadow-lg pb-safe">
      
      {/* Ledger tab */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1.5 transition-all ${
          pathname === "/" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Wallet className={`w-4 h-4 ${pathname === "/" ? "text-emerald-500" : ""}`} />
        <span className="text-[10px]">Ledger</span>
      </Link>

      {/* Stats tab */}
      <Link
        href="/stats"
        className={`flex flex-col items-center gap-1.5 transition-all ${
          pathname === "/stats" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <TrendingUp className={`w-4 h-4 ${pathname === "/stats" ? "text-emerald-500" : ""}`} />
        <span className="text-[10px]">Stats</span>
      </Link>

      {/* FAB Add button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all -mt-5 border-4 border-white cursor-pointer"
        title="Add transaction"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Transactions tab */}
      <Link
        href="/transactions"
        className={`flex flex-col items-center gap-1.5 transition-all ${
          pathname === "/transactions" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
        title="Transaction list"
      >
        <List className={`w-4 h-4 ${pathname === "/transactions" ? "text-emerald-500" : ""}`} />
        <span className="text-[10px]">Transactions</span>
      </Link>

      {/* Profile tab */}
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-1.5 transition-all ${
          pathname === "/profile" ? "text-slate-950 font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
        title="User profile"
      >
        <User className={`w-4 h-4 ${pathname === "/profile" ? "text-emerald-500" : ""}`} />
        <span className="text-[10px]">Profile</span>
      </Link>
    </nav>
  );
}
