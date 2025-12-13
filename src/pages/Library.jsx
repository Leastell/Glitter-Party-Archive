import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthProvider";
import {
    listAudioBreaks,
    getAudioBreaksGroupedByFolder,
    getIndividualAudioBreaks,
} from "@/api/audio";
import { updateProfile } from "@/api/auth";
import AudioGridItem from "../components/audio/AudioGridItem";
import FolderItem from "../components/audio/FolderItem";
import FilterControls from "../components/filters/FilterControls";
import DrummerAnimation from "../components/audio/DrummerAnimation";
import { ListMusic, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Library() {
    const navigate = useNavigate();
    const {
        user,
        loading: authLoading,
        updateProfile: updateUserProfile,
    } = useAuth();
    const [audioBreaks, setAudioBreaks] = useState([]);
    const [filteredBreaks, setFilteredBreaks] = useState([]);
    const [folders, setFolders] = useState([]);
    const [openFolders, setOpenFolders] = useState([]);
    const [selectedDecade, setSelectedDecade] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState(null);
    const [freeBreakIds, setFreeBreakIds] = useState([]);

    useEffect(() => {
        const fetchBreaks = async () => {
            setLoading(true);
            try {
                // Redirect to home if no user
                if (authLoading) return;
                if (!user) {
                    navigate(createPageUrl("Home"));
                    setLoading(false);
                    return;
                }

                // Fetch all audio breaks
                const { data: breaks, error } = await listAudioBreaks(
                    "-created_at"
                );
                if (error) throw error;

                const individualBreaks = breaks.filter(
                    (b) => !b.is_folder_item
                );
                const folderItems = breaks.filter((b) => b.is_folder_item);

                const folderGroups = folderItems.reduce((acc, item) => {
                    const folderName = item.folder_name || "Unnamed Folder";
                    if (!acc[folderName]) {
                        acc[folderName] = [];
                    }
                    acc[folderName].push(item);
                    return acc;
                }, {});

                setAudioBreaks(individualBreaks);
                setFolders(folderGroups);

                // Handle free user access
                if (user && user.subscription_status === "free") {
                    // Check if user already has assigned free breaks
                    if (
                        user.free_breaks_ids &&
                        user.free_breaks_ids.length === 5
                    ) {
                        setFreeBreakIds(user.free_breaks_ids);
                    } else {
                        // Generate new random selection
                        // Look for breaks within any folder whose name contains "blue"
                        const blueDrumsBreaks = breaks.filter(
                            (b) =>
                                b.folder_name &&
                                b.folder_name.toLowerCase().includes("blue")
                        );
                        // All other breaks not in a "blue" folder
                        const otherBreaks = breaks.filter(
                            (b) =>
                                !b.folder_name ||
                                !b.folder_name.toLowerCase().includes("blue")
                        );

                        // Select 3 from blue drums (if available) and 2 from others
                        const selectedBlue = blueDrumsBreaks
                            .sort(() => 0.5 - Math.random())
                            .slice(0, Math.min(3, blueDrumsBreaks.length));

                        const remainingSlots = 5 - selectedBlue.length;
                        const selectedOthers = otherBreaks
                            .sort(() => 0.5 - Math.random())
                            .slice(0, remainingSlots);

                        const selectedBreaks = [
                            ...selectedBlue,
                            ...selectedOthers,
                        ];
                        const selectedIds = selectedBreaks.map((b) => b.id);

                        // Store these IDs on the user profile
                        await updateUserProfile({
                            free_breaks_ids: selectedIds,
                        });
                        setFreeBreakIds(selectedIds);
                    }
                }
            } catch (error) {
                console.error("Error fetching breaks:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchBreaks();
        }
    }, [user, authLoading, updateUserProfile, navigate]);

    useEffect(() => {
        // Apply filters whenever audioBreaks, decade, or tags change
        let filtered = [...audioBreaks];
        if (selectedDecade) {
            filtered = filtered.filter((ab) => ab.decade === selectedDecade);
        }
        if (selectedTags.length > 0) {
            filtered = filtered.filter((ab) =>
                selectedTags.every((tag) => ab.tags?.includes(tag))
            );
        }
        setFilteredBreaks(filtered);
    }, [audioBreaks, selectedDecade, selectedTags]);

    const isBreakAccessible = useCallback(
        (breakId) => {
            if (!user) return false;
            // Admin users have full access
            if (user.role === "admin") return true;
            if (user.subscription_status === "subscriber") return true;
            if (user.subscription_status === "free")
                return freeBreakIds.includes(breakId);
            return false;
        },
        [user, freeBreakIds]
    );

    const handleShuffle = () => {
        const accessibleBreaks = filteredBreaks.filter((b) =>
            isBreakAccessible(b.id)
        );
        if (accessibleBreaks.length === 0) return;
        const randomIndex = Math.floor(Math.random() * accessibleBreaks.length);
        const randomBreak = accessibleBreaks[randomIndex];
        setPlayingId(randomBreak.id);
    };

    const handleClearFilters = () => {
        setSelectedDecade("");
        setSelectedTags([]);
    };

    const handleDownload = async (audioBreak) => {
        if (!isBreakAccessible(audioBreak.id)) {
            alert(
                "This break requires a subscription. Please upgrade to download."
            );
            return;
        }

        try {
            const fileExtension = audioBreak.file_url
                .split(".")
                .pop()
                .split("?")[0];
            const sanitizedTitle = audioBreak.title.replace(
                /[^a-zA-Z0-9 _-]/g,
                "_"
            );
            const filename = `${sanitizedTitle}.${fileExtension}`;

            const response = await fetch(audioBreak.file_url);
            if (!response.ok) {
                throw new Error(
                    `Network response was not ok: ${response.statusText}`
                );
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
            alert(
                `Download failed. Unable to retrieve file: ${audioBreak.title}`
            );
        }
    };

    const handlePlay = (id) => {
        // Only check accessibility if trying to play a specific ID (not null for pausing)
        if (id !== null && !isBreakAccessible(id)) {
            alert(
                "This break requires a subscription. Please upgrade to access."
            );
            return;
        }
        setPlayingId((currentId) => (currentId === id ? null : id));
    };

    const toggleFolder = (folderName) => {
        setOpenFolders((prev) =>
            prev.includes(folderName)
                ? prev.filter((name) => name !== folderName)
                : [...prev, folderName]
        );
    };

    const folderContainerVariants = {
        visible: {
            opacity: 1,
            height: "auto",
            overflow: "visible",
            transition: { duration: 0.2, ease: "easeInOut" },
        },
        hidden: {
            opacity: 0,
            height: 0,
            overflow: "hidden",
            transition: { duration: 0.15, ease: "easeInOut" },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="font-mono text-xs animate-pulse">
                    loading archive...
                </div>
            </div>
        );
    }

    // Check if user has access
    if (!user || user.subscription_status === "unauthenticated") {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center border-2 border-black bg-white p-8 max-w-md">
                    <Lock className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="font-heavy text-lg mb-4">access required</h2>
                    <p className="font-mono text-xs mb-6">
                        please select a tier to access the archive
                    </p>
                    <button
                        onClick={() => navigate(createPageUrl("Home"))}
                        className="bg-black text-white border border-black rounded-none font-heavy text-sm px-6 py-3 hover:bg-gray-800"
                    >
                        choose your tier
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative max-w-7xl mx-auto">
            {user.subscription_status === "free" && (
                <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 p-4">
                    <p className="font-mono text-xs text-center">
                        ★ free tier: you have access to 5 random breaks.
                        <button
                            onClick={() => navigate(createPageUrl("Subscribe"))}
                            className="underline ml-2 font-heavy"
                        >
                            upgrade to unlock all
                        </button>
                        ★
                    </p>
                </div>
            )}

            <FilterControls
                selectedDecade={selectedDecade}
                setSelectedDecade={setSelectedDecade}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                onShuffle={handleShuffle}
                onClearFilters={handleClearFilters}
                audioCount={
                    filteredBreaks.filter((b) => isBreakAccessible(b.id)).length
                }
            />

            {filteredBreaks.length === 0 ? (
                <div className="text-center p-12 text-gray-400 border border-dashed border-gray-400">
                    <ListMusic className="w-10 h-10 mx-auto mb-4" />
                    <h3 className="font-heavy text-sm">no matching breaks</h3>
                    <p className="font-mono text-xs mt-2">
                        please adjust your search filters.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {filteredBreaks.map((audioBreak) => (
                        <AudioGridItem
                            key={audioBreak.id}
                            audioBreak={audioBreak}
                            onDownload={handleDownload}
                            isPlaying={playingId === audioBreak.id}
                            onPlay={handlePlay}
                            isLocked={!isBreakAccessible(audioBreak.id)}
                        />
                    ))}
                </div>
            )}

            {Object.keys(folders).length > 0 && filteredBreaks.length > 0 && (
                <div className="my-8">
                    <hr className="border-black border-t" />
                </div>
            )}

            {Object.keys(folders).length > 0 && (
                <div className="space-y-6">
                    {Object.entries(folders).map(
                        ([folderName, folderBreaks]) => (
                            <div key={folderName}>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                                    <FolderItem
                                        folderName={folderName}
                                        sampleCount={folderBreaks.length}
                                        isOpen={openFolders.includes(
                                            folderName
                                        )}
                                        onClick={() => toggleFolder(folderName)}
                                    />
                                </div>

                                <motion.div
                                    className="mt-4 ml-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2"
                                    initial="hidden"
                                    animate={
                                        openFolders.includes(folderName)
                                            ? "visible"
                                            : "hidden"
                                    }
                                    variants={folderContainerVariants}
                                >
                                    {folderBreaks.map((audioBreak) => (
                                        <AudioGridItem
                                            key={audioBreak.id}
                                            audioBreak={audioBreak}
                                            onDownload={handleDownload}
                                            isPlaying={
                                                playingId === audioBreak.id
                                            }
                                            onPlay={handlePlay}
                                            isLocked={
                                                !isBreakAccessible(
                                                    audioBreak.id
                                                )
                                            }
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )
                    )}
                </div>
            )}

            <DrummerAnimation isVisible={playingId !== null} />
        </div>
    );
}
