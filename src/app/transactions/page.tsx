"use client";

import { useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import { formatCurrency, calculateDaysRemaining, formatDateString } from "@/utils/helpers";
import { useState, useMemo } from "react";
import { 
  Search, SlidersHorizontal, ArrowUpDown, Clock, Calendar, 
  CreditCard, ArrowDownLeft, Check, RotateCcw, Trash2, Plus, X 
} from "lucide-react";

export default function TransactionsPage() {
  const {
    entries,
    providerToken,
    setIsModalOpen,
    handleDeleteEntry,
    handleTogglePaidStatus,
    handleSyncToCalendar,
  } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique months from entries
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entries.forEach(entry => {
      if (entry.date) {
        months.add(entry.date.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Convert "YYYY-MM" to readable string "Month Year"
  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  // Filtered and Sorted entries
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(q) || 
          item.amount.toString().includes(q)
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter(item => item.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "paid") {
        result = result.filter(item => item.paid || item.type === "income");
      } else {
        result = result.filter(item => item.type === "expense" && !item.paid);
      }
    }

    // Month filter
    if (selectedMonth !== "all") {
      result = result.filter(item => item.date && item.date.startsWith(selectedMonth));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "amount-desc") {
        return parseFloat(b.amount as any) - parseFloat(a.amount as any);
      }
      if (sortBy === "amount-asc") {
        return parseFloat(a.amount as any) - parseFloat(b.amount as any);
      }
      return 0;
    });

    return result;
  }, [entries, searchQuery, filterType, filterStatus, selectedMonth, sortBy]);

  // Group by Month Year if sorting by date
  const groupedEntries = useMemo(() => {
    if (sortBy.startsWith("amount")) {
      return { "Sorted by Amount": filteredAndSortedEntries };
    }

    const groups: { [key: string]: typeof entries } = {};
    filteredAndSortedEntries.forEach(entry => {
      if (entry.date) {
        const monthKey = entry.date.substring(0, 7);
        const displayKey = formatMonthYear(monthKey);
        if (!groups[displayKey]) {
          groups[displayKey] = [];
        }
        groups[displayKey].push(entry);
      }
    });
    return groups;
  }, [filteredAndSortedEntries, sortBy]);

  // Calculate quick stats of filtered items
  const stats = useMemo(() => {
    let income = 0;
    let outflow = 0;
    filteredAndSortedEntries.forEach(e => {
      const amt = parseFloat(e.amount as any) || 0;
      if (e.type === "income") income += amt;
      else outflow += amt;
    });
    return { income, outflow };
  }, [filteredAndSortedEntries]);

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    setSelectedMonth("all");
    setSortBy("date-desc");
  };

  const hasActiveFilters = 
    searchQuery !== "" || 
    filterType !== "all" || 
    filterStatus !== "all" || 
    selectedMonth !== "all" || 
    sortBy !== "date-desc";

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Ledger History</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {filteredAndSortedEntries.length} Records Found
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>

        {/* Search and Filters Toggle row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search descriptions or amounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center relative ${
              showFilters || hasActiveFilters
                ? "bg-slate-950 border-slate-950 text-white"
                : "bg-white border-slate-200/80 text-slate-500 hover:text-slate-700"
            }`}
            title="Toggle Filter Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && !showFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>

        {/* Filters drawer panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Search Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Type Switcher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Transaction Type</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                {(["all", "income", "expense"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      filterType === type
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/30"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {type === "all" ? "All" : type === "income" ? "Inflow" : "Outflow"}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Filter */}
            {availableMonths.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Month Filter</label>
                <div className="flex gap-1.5 overflow-x-auto hide-scroll pb-1">
                  <button
                    onClick={() => setSelectedMonth("all")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedMonth === "all"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    All Months
                  </button>
                  {availableMonths.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
                        selectedMonth === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {formatMonthYear(m)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paid Status (For outflows only) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Settlement Status</label>
                <div className="flex gap-1.5">
                  {(["all", "paid", "unpaid"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex-1 ${
                        filterStatus === status
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {status === "all" ? "All" : status === "paid" ? "Paid" : "Pending"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sort Order</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Quick totals card */}
        {hasActiveFilters && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Filtered Summary:</span>
            <div className="flex gap-3">
              <span className="text-emerald-600">In: +{formatCurrency(stats.income)}</span>
              <span className="text-slate-800">Out: -{formatCurrency(stats.outflow)}</span>
            </div>
          </div>
        )}

        {/* Main transaction list */}
        <div className="space-y-5">
          {filteredAndSortedEntries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No transactions match the filter criteria</h4>
              <button
                onClick={resetFilters}
                className="text-[10px] text-emerald-600 font-bold hover:underline mt-2 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            Object.keys(groupedEntries).map((monthKey) => (
              <div key={monthKey} className="space-y-2.5">
                {/* Month header banner */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{monthKey}</h3>
                  {sortBy.startsWith("date") && (
                    <span className="text-[9px] text-slate-400 font-bold">
                      {groupedEntries[monthKey].length} entries
                    </span>
                  )}
                </div>

                {/* Entry cards inside group */}
                <div className="space-y-3">
                  {groupedEntries[monthKey].map((item) => {
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
                      <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 entry-card transition-all hover:border-slate-200">
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
                              <span className="text-[10px] text-slate-400">{isExpense ? "Outflow" : "Inflow"}</span>
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

                        {/* Card bottom actions row */}
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
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
