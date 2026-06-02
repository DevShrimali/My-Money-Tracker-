"use client";

import { useApp } from "@/context/AppContext";

export default function Toast() {
  const { toastMsg, toastType } = useApp();

  if (!toastMsg) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10 w-[85%] animate-fade-in">
      <span className={`w-2 h-2 rounded-full ${toastType === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
      <span className="font-medium">{toastMsg}</span>
    </div>
  );
}
