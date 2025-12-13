import { supabase } from "./supabaseClient";

/**
 * List audio breaks with optional sorting
 */
export async function listAudioBreaks(sortBy = "-created_date") {
    try {
        let query = supabase.from("audio_breaks").select("*");

        // Handle sorting
        if (sortBy === "-created_date") {
            query = query.order("created_date", { ascending: false });
        } else if (sortBy === "created_date") {
            query = query.order("created_date", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing audio breaks:", error);
        return { data: [], error };
    }
}

/**
 * Get a specific audio break by ID
 */
export async function getAudioBreak(id) {
    try {
        const { data, error } = await supabase
            .from("audio_breaks")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching audio break:", error);
        return { data: null, error };
    }
}

/**
 * Create a new audio break
 */
export async function createAudioBreak(breakData) {
    try {
        // Generate a UUID for id if not provided
        const dataWithId = {
            ...breakData,
            id: breakData.id || crypto.randomUUID(),
        };

        const { data, error } = await supabase
            .from("audio_breaks")
            .insert([dataWithId])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating audio break:", error);
        return { data: null, error };
    }
}

/**
 * Update an audio break
 */
export async function updateAudioBreak(id, updates) {
    try {
        const { data, error } = await supabase
            .from("audio_breaks")
            .update({
                ...updates,
                updated_date: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating audio break:", error);
        return { data: null, error };
    }
}

/**
 * Delete an audio break
 */
export async function deleteAudioBreak(id) {
    try {
        const { error } = await supabase
            .from("audio_breaks")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting audio break:", error);
        return { error };
    }
}

/**
 * Get audio breaks grouped by folder
 */
export async function getAudioBreaksGroupedByFolder() {
    try {
        const { data: folderItems, error } = await supabase
            .from("audio_breaks")
            .select("*")
            .eq("is_folder_item", true)
            .order("folder_name", { ascending: true });

        if (error) throw error;

        const folderGroups = (folderItems || []).reduce((acc, item) => {
            const folderName = item.folder_name || "Unnamed Folder";
            if (!acc[folderName]) {
                acc[folderName] = [];
            }
            acc[folderName].push(item);
            return acc;
        }, {});

        return { data: folderGroups, error: null };
    } catch (error) {
        console.error("Error getting audio breaks by folder:", error);
        return { data: {}, error };
    }
}

/**
 * Get individual (non-folder) audio breaks
 */
export async function getIndividualAudioBreaks(sortBy = "-created_date") {
    try {
        let query = supabase
            .from("audio_breaks")
            .select("*")
            .eq("is_folder_item", false);

        // Handle sorting
        if (sortBy === "-created_date") {
            query = query.order("created_date", { ascending: false });
        } else if (sortBy === "created_date") {
            query = query.order("created_date", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error getting individual audio breaks:", error);
        return { data: [], error };
    }
}

/**
 * Filter audio breaks by decade and/or tags
 */
export async function filterAudioBreaks(decade = null, tags = []) {
    try {
        let query = supabase.from("audio_breaks").select("*");

        if (decade) {
            query = query.eq("decade", decade);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by tags if provided
        let filtered = data || [];
        if (tags.length > 0) {
            filtered = filtered.filter((ab) =>
                tags.every((tag) => ab.tags?.includes(tag))
            );
        }

        return { data: filtered, error: null };
    } catch (error) {
        console.error("Error filtering audio breaks:", error);
        return { data: [], error };
    }
}

/**
 * Get all unique decades
 */
export async function getUniquDecades() {
    try {
        const { data, error } = await supabase
            .from("audio_breaks")
            .select("decade")
            .not("decade", "is", null);

        if (error) throw error;

        const decades = [...new Set((data || []).map((d) => d.decade))].sort();
        return { data: decades, error: null };
    } catch (error) {
        console.error("Error getting unique decades:", error);
        return { data: [], error };
    }
}

/**
 * Get all unique tags
 */
export async function getUniqueTags() {
    try {
        const { data, error } = await supabase
            .from("audio_breaks")
            .select("tags");

        if (error) throw error;

        const tags = [
            ...new Set((data || []).flatMap((d) => d.tags || [])),
        ].sort();
        return { data: tags, error: null };
    } catch (error) {
        console.error("Error getting unique tags:", error);
        return { data: [], error };
    }
}
