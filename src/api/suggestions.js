import { supabase } from "./supabaseClient";

/**
 * List all suggestions (admin only)
 */
export async function listSuggestions(sortBy = "-created_at") {
    try {
        let query = supabase.from("suggestions").select("*");

        if (sortBy === "-created_at") {
            query = query.order("created_at", { ascending: false });
        } else if (sortBy === "created_at") {
            query = query.order("created_at", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing suggestions:", error);
        return { data: [], error };
    }
}

/**
 * Get suggestions by status
 */
export async function listSuggestionsByStatus(status = "pending") {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error(
            `Error listing suggestions with status ${status}:`,
            error
        );
        return { data: [], error };
    }
}

/**
 * Get a specific suggestion by ID
 */
export async function getSuggestion(id) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching suggestion:", error);
        return { data: null, error };
    }
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(userId, suggestionData) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .insert([
                {
                    user_id: userId,
                    status: "pending",
                    ...suggestionData,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating suggestion:", error);
        return { data: null, error };
    }
}

/**
 * Update a suggestion (admin only)
 */
export async function updateSuggestion(id, updates) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating suggestion:", error);
        return { data: null, error };
    }
}

/**
 * Update suggestion status
 */
export async function updateSuggestionStatus(id, status) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating suggestion status:", error);
        return { data: null, error };
    }
}

/**
 * Delete a suggestion
 */
export async function deleteSuggestion(id) {
    try {
        const { error } = await supabase
            .from("suggestions")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting suggestion:", error);
        return { error };
    }
}

/**
 * Get suggestions by user
 */
export async function getSuggestionsByUser(userId) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error fetching suggestions by user:", error);
        return { data: [], error };
    }
}
