"use client";

import { useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import { User, Mail, Shield, LogOut, Info, Calendar, Database } from "lucide-react";

export default function ProfilePage() {
  const { user, handleLogout, entries } = useApp();

  const isGuest = !user;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Guest User";
  const email = user?.email || "guest@prosper.local";
  const initial = fullName.charAt(0).toUpperCase();

  // Statistics
  const totalEntries = entries.length;
  const syncedEntries = entries.filter(e => e.calendar_event_id).length;
  const unpaidBills = entries.filter(e => e.type === 'expense' && !e.paid).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-500" />
          <h3 className="font-extrabold text-slate-900 text-base">User Profile</h3>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          {/* Avatar Bubble */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-slate-900/10 mb-4 border-4 border-white">
            {initial}
          </div>

          <h4 className="text-lg font-bold text-slate-900">{fullName}</h4>
          <span className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5 mt-1">
            <Mail className="w-3.5 h-3.5" />
            {email}
          </span>

          <div className="mt-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
              isGuest 
                ? "bg-slate-50 text-slate-500 border-slate-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}>
              <Shield className="w-3 h-3" />
              {isGuest ? "Guest Mode Workspace" : "Supabase Account"}
            </span>
          </div>
        </div>

        {/* Workspace Summary Info */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Workspace Summary</h4>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[18px] font-black text-slate-800 block">{totalEntries}</span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase mt-0.5">Total Logs</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[18px] font-black text-emerald-600 block">{syncedEntries}</span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase mt-0.5">Synced Events</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[18px] font-black text-rose-500 block">{unpaidBills}</span>
              <span className="text-[9px] font-bold text-slate-400 block uppercase mt-0.5">Unpaid Bills</span>
            </div>
          </div>
        </div>

        {/* Integration Details */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-slate-400" />
            System Integrations
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Ledger Database</span>
              <span className="font-bold text-slate-800">{isGuest ? "Browser Cache" : "Supabase Cloud"}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Calendar Sync remind</span>
              <span className="font-bold text-slate-800">{user?.app_metadata?.provider === "google" ? "Enabled (Google)" : "Unavailable (Login required)"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">App Version</span>
              <span className="font-bold text-slate-400">v1.1.0</span>
            </div>
          </div>
        </div>

        {/* User Session Settings */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
            <Info className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">Account Session</h4>
          </div>
          
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isGuest 
              ? "You are currently running in Local Sandbox mode. To sync EMIs and expenses automatically with Google Calendar and save entries securely in the database, sign in with your account." 
              : "You are signed in. Click sign out to clear active server credentials from this device."
            }
          </p>

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-slate-900 hover:bg-slate-50 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-98 cursor-pointer shadow-md"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isGuest ? "Exit Guest Mode / Sign In" : "Sign Out Account"}</span>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
