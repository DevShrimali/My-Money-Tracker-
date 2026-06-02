"use client";

import { useApp } from "@/context/AppContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import AddEntryModal from "./AddEntryModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3 font-semibold">Initializing workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-slate-50 flex flex-col relative border-x border-slate-100/50 shadow-2xl">
      {/* Top Branding Header */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 px-5 py-4 space-y-6 pb-28">
        {children}
      </main>

      {/* Shared Overlay Elements */}
      <Toast />
      <AddEntryModal />
      <BottomNav />
    </div>
  );
}
