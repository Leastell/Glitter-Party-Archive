/**
 * Asset URLs from environment. Set these in .env.local.
 * VITE_PUBLIC_STORAGE_BASE = your Supabase storage public URL (e.g. https://xxx.supabase.co/storage/v1/object/public/your-bucket)
 * VITE_CUSTOM_FONT_URL = full URL for the custom font .ttf file (optional)
 *
 * ASSET_PATHS: paths under your storage base. When base is the "images" bucket,
 * use folder "resource/". Audio lives in the "audio" bucket (see storage.js).
 */

const STORAGE_BASE = import.meta.env.VITE_PUBLIC_STORAGE_BASE || "";

const IMAGES_RESOURCE = "resource";

export const ASSET_PATHS = {
    navMusicIcon: `${IMAGES_RESOURCE}/music_note.png`,
    navCommunityIcon: `${IMAGES_RESOURCE}/earth_heart.png`,
    avatarPlaceholder: `${IMAGES_RESOURCE}/smiley.png`,
    musicNotesIcon: `${IMAGES_RESOURCE}/music_notes.png`,
    stickerNew: `${IMAGES_RESOURCE}/blue_starburst.png`,
    stickerHot: `${IMAGES_RESOURCE}/red_starburst.png`,
    stickerLong: `${IMAGES_RESOURCE}/yellow_starburst.png`,
    archiveBanner: `${IMAGES_RESOURCE}/archive_banner.png`,
};

export function getStorageUrl(path) {
    if (!STORAGE_BASE) return "";
    const base = STORAGE_BASE.replace(/\/$/, "");
    return `${base}/${path}`;
}

export function getArchiveBannerUrl() {
    return getStorageUrl(ASSET_PATHS.archiveBanner);
}

export function getCustomFontUrl() {
    return import.meta.env.VITE_CUSTOM_FONT_URL || "";
}
