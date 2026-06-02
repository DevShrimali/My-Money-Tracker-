"use client";

import { useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import { formatCurrency } from "@/utils/helpers";
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, PieChart, ShieldAlert } from "lucide-react";

export default function StatsPage() {
  const { entries, handleResetApp } = useApp();

  // Financial calculations
  let totalIncome = 0;
  let totalExpenses = 0;
  let paidExpenses = 0;
  let unpaidExpenses = 0;
  let unpaidCount = 0;

  entries.forEach((item) => {
    const amt = parseFloat(item.amount as any) || 0;
    if (item.type === "income") {
      totalIncome += amt;
    } else if (item.type === "expense") {
      totalExpenses += amt;
      if (item.paid) {
        paidExpenses += amt;
      } else {
        unpaidExpenses += amt;
        unpaidCount++;
      }
    }
  });

  const netBalance = totalIncome - totalExpenses;
  
  // Savings Rate
  const savingsAmount = Math.max(0, netBalance);
  const savingsRate = totalIncome > 0 ? Math.round((savingsAmount / totalIncome) * 100) : 0;

  // Clearance rate (by count of bills)
  const totalExpCount = entries.filter((e) => e.type === "expense").length;
  const paidExpCount = entries.filter((e) => e.type === "expense" && e.paid).length;
  const clearanceRate = totalExpCount > 0 ? Math.round((paidExpCount / totalExpCount) * 100) : 0;

  // Budget commitment level (expenses vs income)
  const burnRate = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-extrabold text-slate-900 text-base">Clearance Analytics</h3>
        </div>

        {/* Clearance Gauge Ring/Metric */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-4">LIABILITY CLEARANCE RATE</span>

          {/* Visual Progress Arc/Circle */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-emerald-500 transition-all duration-1000"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * clearanceRate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{clearanceRate}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Bills Settled</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 w-full border-t border-slate-100 pt-4 text-xs font-semibold">
            <div className="text-center border-r border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wide block">Cleared Count</span>
              <span className="text-slate-800 text-sm font-extrabold block mt-0.5">{paidExpCount} of {totalExpCount}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wide block">Pending Dues</span>
              <span className="text-rose-500 text-sm font-extrabold block mt-0.5">{unpaidCount} bills</span>
            </div>
          </div>
        </div>

        {/* Ledger Analysis Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Burn Rate</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-extrabold text-2xl text-slate-900">{burnRate}%</span>
              <span className="text-[9px] font-bold text-slate-400">of income</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div 
                style={{ width: `${burnRate}%` }}
                className={`h-full rounded-full transition-all duration-700 ${
                  burnRate <= 30 ? 'bg-emerald-500' : burnRate <= 70 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Savings Rate</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-extrabold text-2xl text-emerald-600">{savingsRate}%</span>
              <span className="text-[9px] font-bold text-slate-400">surplus</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div 
                style={{ width: `${savingsRate}%` }}
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              ></div>
            </div>
          </div>
        </div>

        {/* Financial Flow Breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-slate-400" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Budget Inflow & Outflow</h4>
          </div>
          
          <div className="space-y-3.5">
            {/* Total Inflow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Total Inflow
                </span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full"></div>
              </div>
            </div>

            {/* Total Outflow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                  Total Outflow
                </span>
                <span className="font-bold text-slate-800">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100}%` }}
                  className="h-full bg-slate-400"
                ></div>
              </div>
            </div>

            {/* Paid Expenses subset */}
            <div className="space-y-1.5 pl-4 border-l border-slate-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Settled (Paid)</span>
                <span className="font-bold text-slate-600">{formatCurrency(paidExpenses)}</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalExpenses > 0 ? (paidExpenses / totalExpenses) * 100 : 0}%` }}
                  className="h-full bg-emerald-400"
                ></div>
              </div>
            </div>

            {/* Unpaid Expenses subset */}
            <div className="space-y-1.5 pl-4 border-l border-slate-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Unpaid Liabilities</span>
                <span className="font-bold text-rose-500">{formatCurrency(unpaidExpenses)}</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalExpenses > 0 ? (unpaidExpenses / totalExpenses) * 100 : 0}%` }}
                  className="h-full bg-rose-400"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Management Controls */}
        <div className="bg-rose-50/50 rounded-3xl p-5 border border-rose-100/50 space-y-4">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-rose-950 text-xs uppercase tracking-wider">Danger Zone</h4>
          </div>
          <p className="text-[11px] text-rose-700/80 leading-relaxed">
            Resetting clears the current local state storage containing your guest entries and resets tracking metrics immediately.
          </p>
          <button
            onClick={handleResetApp}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-98 cursor-pointer shadow-md shadow-rose-600/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset App Workspace</span>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
