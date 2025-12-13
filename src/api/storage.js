import { supabase } from "./supabaseClient";

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(bucket, path, file) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error(`Error uploading file to ${bucket}:`, error);
        return { data: null, error };
    }
}

/**
 * Get a public URL for a file
 */
export function getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
}

/**
 * Create a signed URL for a file (private access)
 */
export async function createSignedUrl(bucket, path, expiresIn = 3600) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error(
            `Error creating signed URL for ${bucket}/${path}:`,
            error
        );
        return { data: null, error };
    }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket, path) {
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error(`Error deleting file from ${bucket}:`, error);
        return { error };
    }
}

/**
 * List files in a bucket directory
 */
export async function listFilesInBucket(bucket, path = "") {
    try {
        const { data, error } = await supabase.storage.from(bucket).list(path, {
            limit: 100,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
        });

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error(`Error listing files in ${bucket}:`, error);
        return { data: [], error };
    }
}

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudio(userId, file) {
    try {
        // Generate unique filename while preserving original name
        // Use timestamp to avoid collisions if same file uploaded multiple times
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const fileName = `${timestamp}_${nameWithoutExt}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        return uploadFile("audio", filePath, file);
    } catch (error) {
        console.error("Error uploading audio:", error);
        return { data: null, error };
    }
}

/**
 * Upload video file to Supabase Storage
 */
export async function uploadVideo(userId, file) {
    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        return uploadFile("video", filePath, file);
    } catch (error) {
        console.error("Error uploading video:", error);
        return { data: null, error };
    }
}

/**
 * Upload image file to Supabase Storage
 */
export async function uploadImage(userId, file) {
    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        return uploadFile("images", filePath, file);
    } catch (error) {
        console.error("Error uploading image:", error);
        return { data: null, error };
    }
}

/**
 * Get public audio URL
 */
export function getAudioPublicUrl(path) {
    return getPublicUrl("audio", path);
}

/**
 * Get public video URL
 */
export function getVideoPublicUrl(path) {
    return getPublicUrl("video", path);
}

/**
 * Get public image URL
 */
export function getImagePublicUrl(path) {
    return getPublicUrl("images", path);
}

/**
 * Delete audio file
 */
export async function deleteAudio(path) {
    return deleteFile("audio", path);
}

/**
 * Delete video file
 */
export async function deleteVideo(path) {
    return deleteFile("video", path);
}

/**
 * Delete image file
 */
export async function deleteImage(path) {
    return deleteFile("images", path);
}
