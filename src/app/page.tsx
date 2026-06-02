"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Plus, LogOut, Calendar, TrendingUp, TrendingDown, 
  Clock, ArrowDownLeft, CreditCard, Check, RotateCcw, 
  Trash2, HelpCircle, Wallet, LogIn, Sparkles, ChevronRight
} from "lucide-react";

interface Entry {
  id: string;
  user_id: string;
  type: "income" | "expense";
  name: string;
  amount: number;
  date: string;
  paid: boolean;
  calendar_event_id?: string;
  created_at?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();


  // App states
  const [user, setUser] = useState<any>(null);
  const [providerToken, setProviderToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentFilter, setCurrentFilter] = useState<"all" | "income" | "expense" | "unpaid">("all");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Authentication & session checker
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        if (session.provider_token) {
          setProviderToken(session.provider_token);
        }
        fetchEntries(session.user.id);
      } else {
        const guestFlag = localStorage.getItem("prosper_guest_session");
        if (guestFlag === "true") {
          setUser({ id: "guest", email: "guest@prosper.local", user_metadata: { name: "Guest User", full_name: "Guest" } });
          fetchLocalEntries();
        } else {
          router.push("/auth");
        }
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth state alterations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session) {
        setUser(session.user);
        if (session.provider_token) {
          setProviderToken(session.provider_token);
        }
        fetchEntries(session.user.id);
      } else {
        const guestFlag = localStorage.getItem("prosper_guest_session");
        if (guestFlag === "true") {
          setUser({ id: "guest", email: "guest@prosper.local", user_metadata: { name: "Guest User", full_name: "Guest" } });
          fetchLocalEntries();
        } else {
          router.push("/auth");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch entries from Supabase
  const fetchEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load entries", "error");
    }
  };

  // Fetch entries from localStorage
  const fetchLocalEntries = () => {
    try {
      const localData = localStorage.getItem("prosper_entries");
      if (localData) {
        setEntries(JSON.parse(localData));
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error("Failed to load local entries", err);
    }
  };

  // Toast notifier utility
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Logout handler
  const handleLogout = async () => {
    localStorage.removeItem("prosper_guest_session");
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Reset app data (for local guest mode)
  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to clear all transactions and reset the app? This cannot be undone.")) {
      localStorage.removeItem("prosper_entries");
      setEntries([]);
      showToast("App reset successfully.");
    }
  };

  // Add new ledger record
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAmount || !formDate || !user) return;

    setFormSubmitting(true);
    const amountNum = parseFloat(formAmount);

    // Guest storage logic
    if (user.id === "guest") {
      const newEntry: Entry = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: "guest",
        type: formType,
        name: formName,
        amount: amountNum,
        date: formDate,
        paid: formType === "income" ? true : false,
      };
      const updated = [...entries, newEntry];
      setEntries(updated);
      localStorage.setItem("prosper_entries", JSON.stringify(updated));
      showToast("Transaction registered successfully.");
      setIsModalOpen(false);
      setFormName("");
      setFormAmount("");
      setFormDate("");
      setFormSubmitting(false);
      return;
    }

    // Live Database logic
    try {
      const entryPayload: Omit<Entry, "id"> = {
        user_id: user.id,
        type: formType,
        name: formName,
        amount: amountNum,
        date: formDate,
        paid: formType === "income" ? true : false,
      };

      const { data, error } = await supabase
        .from("entries")
        .insert([entryPayload])
        .select()
        .single();

      if (error) throw error;
      const newEntry: Entry = data;

      setEntries((prev) => [...prev, newEntry]);
      showToast("Transaction registered successfully.");
      setIsModalOpen(false);
      setFormName("");
      setFormAmount("");
      setFormDate("");
    } catch (err: any) {
      showToast(err.message || "Failed to add entry", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete transaction record
  const handleDeleteEntry = async (item: Entry) => {
    if (item.user_id === "guest") {
      const updated = entries.filter((e) => e.id !== item.id);
      setEntries(updated);
      localStorage.setItem("prosper_entries", JSON.stringify(updated));
      showToast("Transaction record removed.");
      return;
    }

    try {
      const { error } = await supabase.from("entries").delete().eq("id", item.id);
      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== item.id));
      showToast("Transaction record removed.");
    } catch (err: any) {
      showToast(err.message || "Failed to delete entry", "error");
    }
  };

  // Toggle paid status
  const handleTogglePaidStatus = async (item: Entry) => {
    if (item.user_id === "guest") {
      const updatedPaid = !item.paid;
      const updated = entries.map((e) => (e.id === item.id ? { ...e, paid: updatedPaid } : e));
      setEntries(updated);
      localStorage.setItem("prosper_entries", JSON.stringify(updated));
      showToast(updatedPaid ? "Settlement updated to Paid" : "Reverted to pending due");
      return;
    }

    try {
      const updatedPaid = !item.paid;
      const { error } = await supabase
        .from("entries")
        .update({ paid: updatedPaid })
        .eq("id", item.id);

      if (error) throw error;

      setEntries((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, paid: updatedPaid } : e))
      );
      showToast(updatedPaid ? "Settlement updated to Paid" : "Reverted to pending due");
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Sync entry to Google Calendar on request
  const handleSyncToCalendar = async (item: Entry) => {
    if (!providerToken) {
      showToast("Please sign in with Google first.", "error");
      return;
    }
    try {
      const syncRes = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerToken,
          name: item.name,
          amount: item.amount,
          date: item.date,
          type: item.type,
          id: item.id,
        }),
      });
      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.eventId) {
        // Update Supabase
        const { error } = await supabase
          .from("entries")
          .update({ calendar_event_id: syncData.eventId })
          .eq("id", item.id);
        
        if (error) throw error;

        // Update local state
        setEntries((prev) =>
          prev.map((e) => (e.id === item.id ? { ...e, calendar_event_id: syncData.eventId } : e))
        );
        showToast("Synced to Google Calendar!");
      } else {
        showToast(syncData.error || "Calendar sync failed.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to sync to Calendar", "error");
    }
  };

  // Scroll navigation helpers for tab actions
  const scrollToTop = () => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const scrollToStats = () => {
    const el = document.getElementById("analytics-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToGuide = () => {
    const el = document.getElementById("guide-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToLedger = () => {
    const el = document.getElementById("ledger-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // calculations
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

  // Currency formats
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Date layout helpers
  const calculateDaysRemaining = (targetDateStr: string, isPaid: boolean, type: string) => {
    if (isPaid || type === 'income') return { daysRemaining: 0, status: 'complete' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { daysRemaining: days };
  };

  // Format date helper
  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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

  // Extract user first name for personalized section
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.user_metadata?.name?.split(" ")[0] || "Trader";

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
      {/* Top Header Section */}
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

        {/* User profile & logout controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Hi, {userName}
          </span>
          <button 
            onClick={handleLogout} 
            title="Log Out" 
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main scrolling content area */}
      <main ref={mainScrollRef} id="main-scroll" className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-28 hide-scroll">
        
        {/* Floating App Hero Card */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Net Balance</p>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1">{formatCurrency(netBalance)}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{netBalance >= 0 ? 'Savings surplus this month' : `Deficit of ${formatCurrency(Math.abs(netBalance))}`}</p>
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
              <h4 className="text-lg font-bold text-slate-900 mt-0.5" id="gauge-status">
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

        {/* Analytics Card Details Section */}
        <div id="analytics-section" className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Clearance Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Unpaid Commits</span>
              <span className="font-extrabold text-2xl text-slate-900 block mt-2" id="stat-unpaid-count">{unpaidCount}</span>
              <span className="text-[10px] text-slate-400 block mt-1" id="stat-unpaid-amount">{formatCurrency(unpaidExpenses)} remaining</span>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Clearance Rate</span>
              {(() => {
                const totalExp = entries.filter(e => e.type === 'expense').length;
                const paidExp = entries.filter(e => e.type === 'expense' && e.paid).length;
                const clearRate = totalExp > 0 ? Math.round((paidExp / totalExp) * 100) : 0;
                return (
                  <>
                    <span className="font-extrabold text-2xl text-slate-900 block mt-2" id="stat-clearance-rate">{clearRate}%</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{paidExp} of {totalExp} bills paid</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Guide / Walkthrough Section */}
        <div id="guide-section" className="bg-slate-900 text-white rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm">Prosper Quick Guide</h4>
          </div>
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0">1</span>
              <p>Sign in using your Google account to authorize automatic sync with your Google Calendar.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0">2</span>
              <p>Select the checkbox during billing addition to place an all-day calendar event reminder dynamically.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 flex-shrink-0">3</span>
              <p>Tap <strong className="text-white">Pay</strong> to settle a transaction, or remove it entirely to automatically clean it from your linked Google Calendar.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Toast Alert Popups */}
      {toastMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10 w-[85%] animate-fade-in">
          <span className={`w-2 h-2 rounded-full ${toastType === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Floating Action Modal Sheet */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
          {/* Modal overlay background clicks */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal card content wrapper */}
          <div className="relative w-full bg-white rounded-t-[32px] p-6 space-y-5 border-t border-slate-100 modal-enter max-h-[85vh] overflow-y-auto">
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

              {/* Title Input */}
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
              {providerToken && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-950 block">Google Calendar Sync</span>
                    <span className="text-[10px] text-emerald-700/80 block">Creates dynamic payment reminder events.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(e) => setSyncCalendar(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                </div>
              )}

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
      )}

      {/* App Fixed Bottom Navigation Tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[480px] w-full bg-white/95 backdrop-blur-md border-t border-slate-100/90 py-2.5 px-4 flex items-center justify-around z-30 shadow-lg pb-safe">
        
        {/* Ledger tab */}
        <button
          onClick={scrollToLedger}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-950 transition-all cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-700">Ledger</span>
        </button>

        {/* Stats tab */}
        <button
          onClick={scrollToStats}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-950 transition-all cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Stats</span>
        </button>

        {/* FAB Add button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all -mt-5 border-4 border-white cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Guide tab */}
        <button
          onClick={scrollToGuide}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-950 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Guide</span>
        </button>

        {/* Scroll back top */}
        <button
          onClick={scrollToTop}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-950 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
          <span className="text-[10px] font-semibold">Top</span>
        </button>
      </nav>
    </div>
  );
}
