import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your-project-id") ||
    supabaseAnonKey.includes("your_") ||
    supabaseAnonKey.includes("your-");

if (isPlaceholder) {
    console.error(
        "Supabase is not configured. In .env.local set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your real project values (from Supabase Dashboard → Settings → API). Restart the dev server after editing .env.local."
    );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
    auth: {
        // This tells Supabase to automatically handle OAuth redirects with hash-based tokens
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // ← This is the key! It processes the #access_token from URL
    },
});
