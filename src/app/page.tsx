"use client";

import { useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, calculateDaysRemaining, formatDateString } from "@/utils/helpers";
import { 
  Plus, Calendar, TrendingUp, TrendingDown, 
  Clock, ArrowDownLeft, CreditCard, Check, RotateCcw, 
  Trash2 
} from "lucide-react";

export default function Dashboard() {
  const {
    entries,
    currentFilter,
    setCurrentFilter,
    providerToken,
    setIsModalOpen,
    handleDeleteEntry,
    handleTogglePaidStatus,
    handleSyncToCalendar,
  } = useApp();

  // Calculations
  let totalIncome = 0;
  let totalExpenses = 0;
  let unpaidExpenses = 0;
  let unpaidCount = 0;

  entries.forEach(item => {
    const amt = parseFloat(item.amount as any) || 0;
    if (item.type === 'income') {
      totalIncome += amt;
    } else if (item.type === 'expense') {
      totalExpenses += amt;
      if (!item.paid) {
        unpaidExpenses += amt;
        unpaidCount++;
      }
    }
  });

  const netBalance = totalIncome - totalExpenses;
  const ratioPercent = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const displayPercent = Math.min(ratioPercent, 100);

  // Filter & sort
  const filtered = entries.filter((item) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "income") return item.type === "income";
    if (currentFilter === "expense") return item.type === "expense";
    if (currentFilter === "unpaid") return item.type === "expense" && !item.paid;
    return true;
  });

  filtered.sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <AppLayout>
      {/* Floating App Hero Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Net Balance</p>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1">{formatCurrency(netBalance)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {netBalance >= 0 ? 'Savings surplus this month' : `Deficit of ${formatCurrency(Math.abs(netBalance))}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Income Streams</span>
              <span className="font-bold text-sm text-emerald-400 mt-0.5 inline-flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Total Commits</span>
              <span className="font-bold text-sm text-slate-300 mt-0.5 inline-flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Dues KPI & Progress Bar Gauge */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Commitment Gauge</span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              {ratioPercent === 0 ? 'No commitments yet' : ratioPercent <= 30 ? 'Healthy Budget ✔' : ratioPercent <= 60 ? 'Moderate Commitment' : 'Heavy Commitment ⚠️'}
            </h4>
          </div>
          <span className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{ratioPercent}%</span>
        </div>

        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            style={{ width: `${displayPercent}%` }}
            className={`h-full rounded-full transition-all duration-700 ${
              ratioPercent === 0 ? 'bg-slate-300' : ratioPercent <= 30 ? 'bg-emerald-500' : ratioPercent <= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1 text-slate-500">
          <div className="text-left">
            <span className="text-[10px] font-bold block text-slate-400 uppercase">Pending Bills</span>
            <span className="text-sm font-bold text-slate-800">{unpaidCount} bills pending</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold block text-slate-400 uppercase">Due Amount</span>
            <span className="text-sm font-bold text-rose-500">{formatCurrency(unpaidExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Ledger Section */}
      <div id="ledger-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base">Payments Ledger</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
          {(["all", "income", "expense", "unpaid"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setCurrentFilter(type)}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-all ${
                currentFilter === type
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {type === "all" ? "All" : type === "income" ? "Inflow" : type === "expense" ? "Bills & EMIs" : "Unpaid Dues"}
            </button>
          ))}
        </div>

        {/* Transaction Cards List */}
        <div className="space-y-3.5">
          {filtered.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No records found</h4>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">Start by adding a bill or expected paycheck above.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const daysInfo = calculateDaysRemaining(item.date, item.paid, item.type);
              const isExpense = item.type === "expense";

              let badgeClass = "";
              let statusLabel = "";

              if (item.type === "income") {
                badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                statusLabel = "Received";
              } else if (item.paid) {
                badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                statusLabel = "Paid ✔";
              } else if (daysInfo.daysRemaining < 0) {
                badgeClass = "bg-rose-50 text-rose-700 border-rose-100 overdue-pulse";
                statusLabel = `Overdue ${Math.abs(daysInfo.daysRemaining)}d`;
              } else if (daysInfo.daysRemaining <= 7) {
                badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                statusLabel = `${daysInfo.daysRemaining}d left`;
              } else if (daysInfo.daysRemaining <= 14) {
                badgeClass = "bg-amber-50 text-amber-600 border-amber-200";
                statusLabel = `${daysInfo.daysRemaining}d left`;
              } else {
                badgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                statusLabel = `${daysInfo.daysRemaining}d left`;
              }

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 entry-card">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      isExpense ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                    }`}>
                      {isExpense ? <CreditCard className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">{formatDateString(item.date)}</span>
                        <span className="text-[9px] text-slate-300 font-bold">•</span>
                        <span className="text-[10px] text-slate-400">{isExpense ? "Bill/EMI" : "Income"}</span>
                        {item.calendar_event_id && (
                          <>
                            <span className="text-[9px] text-slate-300 font-bold">•</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" /> Cal
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className={`font-bold text-base flex-shrink-0 ${
                      isExpense ? "text-slate-800" : "text-emerald-600"
                    }`}>
                      {isExpense ? "-" : "+"}{formatCurrency(item.amount)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${badgeClass}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {statusLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      {!item.calendar_event_id && providerToken && (
                        <button
                          onClick={() => handleSyncToCalendar(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
                          title="Sync with Google Calendar"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Sync</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleTogglePaidStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-white transition-all cursor-pointer ${
                          item.paid
                            ? "text-slate-400 border-slate-100 hover:bg-slate-50"
                            : "text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                        }`}
                      >
                        {item.paid ? <RotateCcw className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        <span>{item.paid ? "Undo" : isExpense ? "Pay" : "Clear"}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(item)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
