import { supabase } from "./supabaseClient";

/**
 * Fetches the current user from Supabase auth and their profile data.
 * Returns merged object with auth user fields + profile fields.
 * Auto-creates profile if it doesn't exist.
 */
export async function getCurrentUser() {
    try {
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return null;
        }

        // Fetch the user's profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

        // If profile doesn't exist, create one
        if (profileError?.code === "PGRST116") {
            // PGRST116 means "no rows found"
            const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({
                    id: authUser.id,
                    full_name: authUser.user_metadata?.full_name || "",
                    role: "user",
                    subscription_status: "free",
                })
                .select()
                .single();

            if (createError) {
                // Return default user object if creation fails
                return {
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || "",
                    role: "user",
                    subscription_status: "free",
                };
            }

            return {
                id: authUser.id,
                email: authUser.email,
                ...newProfile,
            };
        }

        if (profileError) {
            // Return auth user only if profile fetch fails for other reasons
            return {
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || "",
                role: "user",
                subscription_status: "free",
            };
        }
        // Merge auth user with profile data
        return {
            id: authUser.id,
            email: authUser.email,
            ...profile,
        };
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(redirectTo) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectTo || window.location.origin,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error signing in with Google:", error);
        return { data: null, error };
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error signing out:", error);
        return { error };
    }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates) {
    try {
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            throw new Error("No authenticated user");
        }

        const { data, error } = await supabase
            .from("profiles")
            .upsert(
                {
                    id: authUser.id,
                    ...updates,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            )
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { data: null, error };
    }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return subscription;
}
