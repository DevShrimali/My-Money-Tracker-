"use client";

import { useApp } from "@/context/AppContext";

export default function AddEntryModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    formType,
    setFormType,
    formName,
    setFormName,
    formAmount,
    setFormAmount,
    formDate,
    setFormDate,
    syncCalendar,
    setSyncCalendar,
    formSubmitting,
    providerToken,
    handleAddEntry,
  } = useApp();

  if (!isModalOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
      {/* Modal overlay background clicks */}
      <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
      
      {/* Modal card content wrapper */}
      <div className="relative w-full bg-white rounded-t-[32px] p-6 space-y-5 border-t border-slate-100 modal-enter max-h-[85vh] overflow-y-auto z-50">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto -mt-2"></div>
        
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-950 text-lg">Add Payment / Ledger Entry</h3>
          <button 
            onClick={() => setIsModalOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleAddEntry} className="space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormType("expense")}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                formType === "expense"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Outflow (Bill/EMI)
            </button>
            <button
              type="button"
              onClick={() => setFormType("income")}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                formType === "income"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Inflow (Salary)
            </button>
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Description</label>
            <input
              type="text"
              required
              placeholder={formType === "expense" ? "e.g., Jio Broadband, Rent" : "e.g., Office Salary"}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900"
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                required
                min="1"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Date Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Due / Receipt Date</label>
            <input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900"
            />
          </div>

          {/* Google Calendar Sync */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            providerToken 
              ? "bg-emerald-50/50 border-emerald-100" 
              : "bg-slate-50 border-slate-200/60 opacity-65"
          }`}>
            <div className="space-y-0.5">
              <span className={`text-xs font-bold block ${providerToken ? "text-slate-900" : "text-slate-400"}`}>
                Google Calendar Sync
              </span>
              <span className={`text-[10px] block ${providerToken ? "text-emerald-700/80" : "text-slate-400"}`}>
                {providerToken 
                  ? "Creates dynamic payment reminder events." 
                  : "Sign in with Google to enable calendar events."}
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!providerToken}
              checked={syncCalendar && !!providerToken}
              onChange={(e) => setSyncCalendar(e.target.checked)}
              className={`w-4 h-4 rounded border-slate-300 focus:ring-emerald-500 ${
                providerToken 
                  ? "text-emerald-500 cursor-pointer" 
                  : "text-slate-300 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98 disabled:opacity-50"
          >
            {formSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Register Ledger Transaction</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
