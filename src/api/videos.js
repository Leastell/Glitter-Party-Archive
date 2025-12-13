import { supabase } from "./supabaseClient";

/**
 * List all videos
 */
export async function listVideos(sortBy = "-created_at") {
    try {
        let query = supabase.from("videos").select("*");

        if (sortBy === "-created_at") {
            query = query.order("created_at", { ascending: false });
        } else if (sortBy === "created_at") {
            query = query.order("created_at", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing videos:", error);
        return { data: [], error };
    }
}

/**
 * Get a specific video by ID
 */
export async function getVideo(id) {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching video:", error);
        return { data: null, error };
    }
}

/**
 * Create a new video
 */
export async function createVideo(userId, videoData) {
    try {
        const { data, error } = await supabase
            .from("videos")
            .insert([
                {
                    user_id: userId,
                    ...videoData,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating video:", error);
        return { data: null, error };
    }
}

/**
 * Update a video
 */
export async function updateVideo(id, updates) {
    try {
        const { data, error } = await supabase
            .from("videos")
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
        console.error("Error updating video:", error);
        return { data: null, error };
    }
}

/**
 * Delete a video
 */
export async function deleteVideo(id) {
    try {
        const { error } = await supabase.from("videos").delete().eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting video:", error);
        return { error };
    }
}

/**
 * Get locked (subscription-gated) videos
 */
export async function getLockedVideos() {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("is_locked", true)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error fetching locked videos:", error);
        return { data: [], error };
    }
}

/**
 * Get public (non-locked) videos
 */
export async function getPublicVideos() {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("is_locked", false)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error fetching public videos:", error);
        return { data: [], error };
    }
}

/**
 * Get videos by user
 */
export async function getVideosByUser(userId) {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error fetching videos by user:", error);
        return { data: [], error };
    }
}
