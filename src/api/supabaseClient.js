import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        "Supabase environment variables not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
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
