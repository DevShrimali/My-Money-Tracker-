"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export interface Entry {
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

interface AppContextType {
  user: any;
  providerToken: string;
  loading: boolean;
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  currentFilter: "all" | "income" | "expense" | "unpaid";
  setCurrentFilter: (filter: "all" | "income" | "expense" | "unpaid") => void;
  toastMsg: string;
  toastType: "success" | "error";
  showToast: (msg: string, type?: "success" | "error") => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  formType: "income" | "expense";
  setFormType: (type: "income" | "expense") => void;
  formName: string;
  setFormName: (name: string) => void;
  formAmount: string;
  setFormAmount: (amount: string) => void;
  formDate: string;
  setFormDate: (date: string) => void;
  syncCalendar: boolean;
  setSyncCalendar: (sync: boolean) => void;
  formSubmitting: boolean;
  handleLogout: () => Promise<void>;
  handleResetApp: () => void;
  handleAddEntry: (e: React.FormEvent) => Promise<void>;
  handleDeleteEntry: (item: Entry) => Promise<void>;
  handleTogglePaidStatus: (item: Entry) => Promise<void>;
  handleSyncToCalendar: (item: Entry) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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
      console.error("Supabase load error:", err);
      const isNetworkError = err.message?.toLowerCase().includes("failed to fetch") || 
                            err.message?.toLowerCase().includes("fetch") ||
                            (err.status === 0);
      const friendlyMsg = isNetworkError 
        ? "Network connection issue: Please verify your Supabase project is active (not paused) and internet is stable." 
        : (err.message || "Failed to load entries");
      showToast(friendlyMsg, "error");
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

  // Authentication & session checker
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        if (session.provider_token) {
          setProviderToken(session.provider_token);
          localStorage.setItem("prosper_provider_token", session.provider_token);
        } else {
          const cachedToken = localStorage.getItem("prosper_provider_token");
          if (cachedToken) {
            setProviderToken(cachedToken);
          }
        }
        await fetchEntries(session.user.id);
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
          localStorage.setItem("prosper_provider_token", session.provider_token);
        } else {
          const cachedToken = localStorage.getItem("prosper_provider_token");
          if (cachedToken) {
            setProviderToken(cachedToken);
          }
        }
        fetchEntries(session.user.id);
      } else {
        const guestFlag = localStorage.getItem("prosper_guest_session");
        if (guestFlag === "true") {
          setUser({ id: "guest", email: "guest@prosper.local", user_metadata: { name: "Guest User", full_name: "Guest" } });
          fetchLocalEntries();
        } else {
          setUser(null);
          router.push("/auth");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Toast notifier utility
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Logout handler
  const handleLogout = async () => {
    localStorage.removeItem("prosper_guest_session");
    localStorage.removeItem("prosper_provider_token");
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

      // Handle direct Google Calendar Sync if requested and token is present
      if (syncCalendar && providerToken && formType === "expense") {
        try {
          const syncRes = await fetch("/api/calendar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              providerToken,
              name: newEntry.name,
              amount: newEntry.amount,
              date: newEntry.date,
              type: newEntry.type,
              id: newEntry.id,
            }),
          });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.eventId) {
            // Update Supabase with the calendar event ID
            const { error: updateError } = await supabase
              .from("entries")
              .update({ calendar_event_id: syncData.eventId })
              .eq("id", newEntry.id);
            
            if (!updateError) {
              newEntry.calendar_event_id = syncData.eventId;
            }
          }
        } catch (calErr) {
          console.error("Failed to sync calendar on addition:", calErr);
        }
      }

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

  return (
    <AppContext.Provider
      value={{
        user,
        providerToken,
        loading,
        entries,
        setEntries,
        currentFilter,
        setCurrentFilter,
        toastMsg,
        toastType,
        showToast,
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
        handleLogout,
        handleResetApp,
        handleAddEntry,
        handleDeleteEntry,
        handleTogglePaidStatus,
        handleSyncToCalendar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
