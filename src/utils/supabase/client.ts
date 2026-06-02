import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  const url = supabaseUrl || "https://placeholder-project.supabase.co";
  const key = supabaseKey || "sb_publishable_placeholder";
  return createBrowserClient(url, key);
};
