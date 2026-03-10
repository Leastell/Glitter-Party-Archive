import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { listVideos, deleteVideo } from "@/api/videos";
import { Button } from "@/components/ui/button";
import { Plus, Video as VideoIcon, Lock } from "lucide-react";
import VideoGridItem from "../components/video/VideoGridItem";
import VideoUploadForm from "../components/video/VideoUploadForm";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VideoPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            loadVideos();
        }
    }, [authLoading]);

    const loadVideos = async () => {
        setLoading(true);
        try {
            const result = await listVideos("-created_at");
            setVideos(result.data || []);
        } catch (error) {
            console.error("Error loading videos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (video) => {
        try {
            const fileExtension = video.file_url.split(".").pop().split("?")[0];
            const sanitizedTitle = video.title.replace(/[^a-zA-Z0-9 _-]/g, "_");
            const filename = `${sanitizedTitle}.${fileExtension}`;

            const response = await fetch(video.file_url);
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
            alert(`Download failed. Unable to retrieve file: ${video.title}`);
        }
    };

    const handleDelete = async (video) => {
        if (
            !confirm(
                `Are you sure you want to delete "${video.title}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            const result = await deleteVideo(video.id);
            if (result.error) throw result.error;
            loadVideos();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete video. Please try again.");
        }
    };

    const handleUploadComplete = () => {
        setShowUploadForm(false);
        loadVideos();
    };

    const isAdmin = user?.role === "admin";
    const hasSubscriberAccess = user?.subscription_status === "subscriber";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="font-mono text-xs animate-pulse">
                    loading videos...
                </div>
            </div>
        );
    }

    // Free users see locked message
    if (!hasSubscriberAccess && !isAdmin) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center py-20">
                    <div className="text-center border-2 border-black bg-white p-12 max-w-lg">
                        <Lock className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="font-heavy text-xl mb-4">
                            subscriber access required
                        </h2>
                        <p className="font-mono text-sm mb-6">
                            video archive access is available exclusively to
                            subscribers. upgrade your account to unlock all
                            videos.
                        </p>
                        <button
                            onClick={() => navigate(createPageUrl("Subscribe"))}
                            className="bg-black text-white border border-black rounded-none font-heavy text-sm px-8 py-4 hover:bg-gray-800"
                        >
                            ★ upgrade to subscriber ★
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-heavy text-gray-900">
                    video archive
                </h1>
                {isAdmin && (
                    <Button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="bg-black text-white border border-black rounded-none font-heavy text-xs tracking-wide hover:bg-gray-800"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        upload video
                    </Button>
                )}
            </div>

            {isAdmin && showUploadForm && (
                <VideoUploadForm onUploadComplete={handleUploadComplete} />
            )}

            {videos.length === 0 ? (
                <div className="text-center p-12 text-gray-400 border border-dashed border-gray-400">
                    <VideoIcon className="w-10 h-10 mx-auto mb-4" />
                    <h3 className="font-heavy text-sm">no videos yet</h3>
                    {isAdmin && (
                        <p className="font-mono text-xs mt-2">
                            upload your first video using the button above.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <VideoGridItem
                            key={video.id}
                            video={video}
                            onDownload={handleDownload}
                            onDelete={isAdmin ? handleDelete : null}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
