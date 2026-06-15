import { createClient, SupabaseClient } from "@supabase/supabase-js";

let rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
  global: {
    headers: {
      "x-client-info": "agroconecta",
    },
  },
});

export function createSupabaseClient(baseUrl: string, anonKey: string) {
  return createClient(baseUrl, anonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-client-info": "agroconecta",
      },
    },
  });
}
