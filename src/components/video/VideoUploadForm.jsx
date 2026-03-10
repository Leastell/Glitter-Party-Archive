import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createVideo } from "@/api/videos";
import {
    uploadVideo,
    uploadImage,
    getVideoPublicUrl,
    getImagePublicUrl,
} from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";

const AVAILABLE_TAGS = [
    "performance",
    "interview",
    "documentary",
    "behind-scenes",
    "live",
    "studio",
    "vintage",
    "rare",
    "archive",
];

export default function VideoUploadForm({ onUploadComplete }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        tags: [],
        duration: "",
        aspect_ratio: "horizontal",
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleTag = (tag) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("video/")) {
            setVideoFile(file);
        } else {
            alert("Please select a valid video file.");
        }
    };

    const handleThumbnailSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setThumbnailFile(file);
        } else {
            alert("Please select a valid image file for thumbnail.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile || !formData.title) {
            alert("Please select a video file and enter a title.");
            return;
        }

        if (!user?.id) {
            alert("You must be logged in to upload videos.");
            return;
        }

        setUploading(true);
        try {
            // Upload video file
            const uploadResult = await uploadVideo(user.id, videoFile);
            if (uploadResult.error) throw uploadResult.error;
            const video_url = getVideoPublicUrl(uploadResult.data.path);

            // Upload thumbnail if provided
            let thumbnail_url = null;
            if (thumbnailFile) {
                const thumbResult = await uploadImage(user.id, thumbnailFile);
                if (!thumbResult.error) {
                    thumbnail_url = getImagePublicUrl(thumbResult.data.path);
                }
            }

            // Create video record
            const { error } = await createVideo(user.id, {
                title: formData.title,
                description: formData.description,
                video_url,
                thumbnail_url,
            });

            if (error) throw error;

            setUploaded(true);
            setTimeout(() => {
                onUploadComplete();
                setUploaded(false);
                setFormData({
                    title: "",
                    description: "",
                    tags: [],
                    duration: "",
                    aspect_ratio: "horizontal",
                });
                setVideoFile(null);
                setThumbnailFile(null);
            }, 1500);
        } catch (error) {
            console.error("Video upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (uploaded) {
        return (
            <div className="text-center py-8">
                <div className="border border-black bg-white p-8">
                    <Check className="w-10 h-10 mx-auto mb-4 text-green-500" />
                    <h2 className="font-heavy text-sm mb-2">
                        ★ video uploaded ★
                    </h2>
                </div>
            </div>
        );
    }

    const FormLabel = ({ children, required }) => (
        <Label className="font-mono text-xs tracking-wide mb-2 block text-black">
            ★ {children}
            {required && ":"}
        </Label>
    );

    const TagButton = ({ label, isActive, onClick }) => (
        <button
            type="button"
            onClick={onClick}
            className={`font-mono text-xs px-2 py-1 border border-black transition-all duration-150 ${
                isActive ? "bg-black text-white" : "bg-white hover:bg-gray-100"
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="border border-black bg-white p-6 mb-6">
            <h2 className="font-heavy text-sm tracking-wide mb-6">
                ★ upload new video ★
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <FormLabel required>video file</FormLabel>
                    <div className="border border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                            id="video-upload"
                        />
                        <label
                            htmlFor="video-upload"
                            className="cursor-pointer"
                        >
                            {videoFile ? (
                                <p className="font-mono text-black text-xs">
                                    ★ {videoFile.name} ★
                                </p>
                            ) : (
                                <p className="font-mono text-gray-500 text-xs">
                                    ★ drag video here or [click] ★
                                </p>
                            )}
                        </label>
                    </div>
                </div>

                <div>
                    <FormLabel>thumbnail image</FormLabel>
                    <div className="border border-dashed border-black p-4 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailSelect}
                            className="hidden"
                            id="thumbnail-upload"
                        />
                        <label
                            htmlFor="thumbnail-upload"
                            className="cursor-pointer"
                        >
                            {thumbnailFile ? (
                                <p className="font-mono text-black text-xs">
                                    ★ {thumbnailFile.name} ★
                                </p>
                            ) : (
                                <p className="font-mono text-gray-500 text-xs">
                                    ★ optional thumbnail ★
                                </p>
                            )}
                        </label>
                    </div>
                </div>

                <div>
                    <FormLabel required>title</FormLabel>
                    <Input
                        value={formData.title}
                        onChange={(e) =>
                            handleInputChange("title", e.target.value)
                        }
                        className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                        required
                    />
                </div>

                <div>
                    <FormLabel>description</FormLabel>
                    <Textarea
                        value={formData.description}
                        onChange={(e) =>
                            handleInputChange("description", e.target.value)
                        }
                        className="font-mono border border-black rounded-none px-3 py-2 text-sm h-20"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FormLabel>duration (seconds)</FormLabel>
                        <Input
                            type="number"
                            value={formData.duration}
                            onChange={(e) =>
                                handleInputChange("duration", e.target.value)
                            }
                            className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                            placeholder="e.g. 180"
                        />
                    </div>
                    <div>
                        <FormLabel required>orientation</FormLabel>
                        <Select
                            value={formData.aspect_ratio}
                            onValueChange={(value) =>
                                handleInputChange("aspect_ratio", value)
                            }
                        >
                            <SelectTrigger className="font-mono border border-black rounded-none h-9 text-sm">
                                <SelectValue placeholder="select..." />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-none bg-white font-mono text-sm">
                                <SelectItem value="horizontal">
                                    horizontal (16:9)
                                </SelectItem>
                                <SelectItem value="vertical">
                                    vertical (9:16)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <FormLabel>tags</FormLabel>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map((tag) => (
                            <TagButton
                                key={tag}
                                label={tag}
                                isActive={formData.tags.includes(tag)}
                                onClick={() => toggleTag(tag)}
                            />
                        ))}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={uploading}
                    className="w-full h-10 bg-black text-white rounded-none font-heavy text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                    {uploading ? "★ uploading... ★" : "★ upload video ★"}
                </Button>
            </form>
        </div>
    );
}
