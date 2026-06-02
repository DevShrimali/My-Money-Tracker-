import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prosper — India's Premier EMI & Expense Tracker",
  description: "Modern, swipe-friendly, India-localized bill tracking application synced with Google Calendar and Supabase database.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { AppProvider } from "@/context/AppContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 select-none">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
