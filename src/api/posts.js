import { supabase } from "./supabaseClient";

// ============================================================================
// POSTS
// ============================================================================

/**
 * List all posts
 */
export async function listPosts(sortBy = "-created_at") {
    try {
        let query = supabase.from("posts").select("*");

        if (sortBy === "-created_at") {
            query = query.order("created_at", { ascending: false });
        } else if (sortBy === "created_at") {
            query = query.order("created_at", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing posts:", error);
        return { data: [], error };
    }
}

/**
 * Get a specific post by ID
 */
export async function getPost(id) {
    try {
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching post:", error);
        return { data: null, error };
    }
}

/**
 * Create a new post
 */
export async function createPost(userId, postData) {
    try {
        const { data, error } = await supabase
            .from("posts")
            .insert([
                {
                    user_id: userId,
                    ...postData,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating post:", error);
        return { data: null, error };
    }
}

/**
 * Update a post
 */
export async function updatePost(id, updates) {
    try {
        const { data, error } = await supabase
            .from("posts")
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
        console.error("Error updating post:", error);
        return { data: null, error };
    }
}

/**
 * Delete a post
 */
export async function deletePost(id) {
    try {
        const { error } = await supabase.from("posts").delete().eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting post:", error);
        return { error };
    }
}

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * List all comments
 */
export async function listComments(sortBy = "-created_at") {
    try {
        let query = supabase.from("comments").select("*");

        if (sortBy === "-created_at") {
            query = query.order("created_at", { ascending: false });
        } else if (sortBy === "created_at") {
            query = query.order("created_at", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing comments:", error);
        return { data: [], error };
    }
}

/**
 * Get comments for a specific item (video, post, or poll)
 */
export async function getCommentsForItem(itemId, itemType = "post") {
    try {
        let query = supabase
            .from("comments")
            .select("*")
            .eq(`${itemType}_id`, itemId)
            .order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error(`Error fetching comments for ${itemType}:`, error);
        return { data: [], error };
    }
}

/**
 * Create a new comment
 */
export async function createComment(userId, commentData) {
    try {
        const { data, error } = await supabase
            .from("comments")
            .insert([
                {
                    user_id: userId,
                    ...commentData,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating comment:", error);
        return { data: null, error };
    }
}

/**
 * Delete a comment
 */
export async function deleteComment(id) {
    try {
        const { error } = await supabase.from("comments").delete().eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { error };
    }
}

// ============================================================================
// POLLS
// ============================================================================

/**
 * List all polls
 */
export async function listPolls(sortBy = "-created_at") {
    try {
        let query = supabase.from("polls").select("*");

        if (sortBy === "-created_at") {
            query = query.order("created_at", { ascending: false });
        } else if (sortBy === "created_at") {
            query = query.order("created_at", { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error("Error listing polls:", error);
        return { data: [], error };
    }
}

/**
 * Get a specific poll by ID
 */
export async function getPoll(id) {
    try {
        const { data, error } = await supabase
            .from("polls")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error fetching poll:", error);
        return { data: null, error };
    }
}

/**
 * Create a new poll
 */
export async function createPoll(userId, pollData) {
    try {
        const { data, error } = await supabase
            .from("polls")
            .insert([
                {
                    user_id: userId,
                    ...pollData,
                    votes: {}, // Initialize empty votes
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating poll:", error);
        return { data: null, error };
    }
}

/**
 * Vote on a poll option
 */
export async function voteOnPoll(pollId, option) {
    try {
        const { data: poll, error: fetchError } = await supabase
            .from("polls")
            .select("votes")
            .eq("id", pollId)
            .single();

        if (fetchError) throw fetchError;

        const votes = poll.votes || {};
        votes[option] = (votes[option] || 0) + 1;

        const { data, error } = await supabase
            .from("polls")
            .update({
                votes,
                updated_at: new Date().toISOString(),
            })
            .eq("id", pollId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error voting on poll:", error);
        return { data: null, error };
    }
}

/**
 * Delete a poll
 */
export async function deletePoll(id) {
    try {
        const { error } = await supabase.from("polls").delete().eq("id", id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error("Error deleting poll:", error);
        return { error };
    }
}
