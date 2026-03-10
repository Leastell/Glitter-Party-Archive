import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createVideo } from "@/api/videos";
import { createPost } from "@/api/posts";
import { createPoll } from "@/api/posts";
import {
    uploadVideo,
    uploadImage,
    getVideoPublicUrl,
    getImagePublicUrl,
} from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Video as VideoIcon,
    BarChart3,
    Image as ImageIcon,
    Plus,
    X,
} from "lucide-react";

const VIDEO_TAGS = [
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

export default function CreatePostForm({ onCreateComplete }) {
    const { user } = useAuth();
    const [postType, setPostType] = useState("post"); // "post", "video", "poll", "image"
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        description: "",
        tags: [],
        question: "",
        pollOptions: ["", ""],
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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

    const addPollOption = () => {
        setFormData((prev) => ({
            ...prev,
            pollOptions: [...prev.pollOptions, ""],
        }));
    };

    const removePollOption = (index) => {
        setFormData((prev) => ({
            ...prev,
            pollOptions: prev.pollOptions.filter((_, i) => i !== index),
        }));
    };

    const updatePollOption = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            pollOptions: prev.pollOptions.map((opt, i) =>
                i === index ? value : opt
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) {
            alert("You must be logged in to create posts.");
            return;
        }

        setUploading(true);

        try {
            if (postType === "video") {
                if (!videoFile || !formData.title) {
                    alert("Please provide a video file and title.");
                    return;
                }

                const uploadResult = await uploadVideo(user.id, videoFile);
                if (uploadResult.error) throw uploadResult.error;
                const video_url = getVideoPublicUrl(uploadResult.data.path);

                let thumbnail_url = null;
                if (thumbnailFile) {
                    const thumbResult = await uploadImage(
                        user.id,
                        thumbnailFile
                    );
                    if (!thumbResult.error) {
                        thumbnail_url = getImagePublicUrl(
                            thumbResult.data.path
                        );
                    }
                }

                const { error } = await createVideo(user.id, {
                    title: formData.title,
                    description: formData.description,
                    video_url,
                    thumbnail_url,
                });
                if (error) throw error;
            } else if (postType === "poll") {
                if (
                    !formData.question ||
                    formData.pollOptions.filter((o) => o.trim()).length < 2
                ) {
                    alert("Please provide a question and at least 2 options.");
                    return;
                }

                const validOptions = formData.pollOptions.filter((opt) =>
                    opt.trim()
                );

                const { error } = await createPoll(user.id, {
                    title: formData.question,
                    options: validOptions,
                });
                if (error) throw error;
            } else if (postType === "image") {
                if (!imageFile || !formData.title) {
                    alert("Please provide an image and title.");
                    return;
                }

                const uploadResult = await uploadImage(user.id, imageFile);
                if (uploadResult.error) throw uploadResult.error;
                const image_url = getImagePublicUrl(uploadResult.data.path);

                const { error } = await createPost(user.id, {
                    content: formData.description || formData.title,
                    image_url,
                });
                if (error) throw error;
            } else {
                if (!formData.title || !formData.content) {
                    alert("Please provide a title and content.");
                    return;
                }

                let image_url = null;
                if (imageFile) {
                    const imageResult = await uploadImage(user.id, imageFile);
                    if (!imageResult.error) {
                        image_url = getImagePublicUrl(imageResult.data.path);
                    }
                }

                const { error } = await createPost(user.id, {
                    content: formData.content,
                    image_url,
                });
                if (error) throw error;
            }

            onCreateComplete();
        } catch (error) {
            console.error("Create post failed:", error);
            alert("Failed to create post. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border-2 border-black bg-white p-6 mb-8">
            <h2 className="font-heavy text-lg mb-4">★ create new post ★</h2>

            {/* Post Type Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setPostType("post")}
                    className={`py-3 font-heavy text-xs border-2 border-black transition-colors ${
                        postType === "post"
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                    }`}
                >
                    <FileText className="w-4 h-4 inline mr-1" />
                    text
                </button>
                <button
                    type="button"
                    onClick={() => setPostType("image")}
                    className={`py-3 font-heavy text-xs border-2 border-black transition-colors ${
                        postType === "image"
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                    }`}
                >
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    image
                </button>
                <button
                    type="button"
                    onClick={() => setPostType("video")}
                    className={`py-3 font-heavy text-xs border-2 border-black transition-colors ${
                        postType === "video"
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                    }`}
                >
                    <VideoIcon className="w-4 h-4 inline mr-1" />
                    video
                </button>
                <button
                    type="button"
                    onClick={() => setPostType("poll")}
                    className={`py-3 font-heavy text-xs border-2 border-black transition-colors ${
                        postType === "poll"
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100"
                    }`}
                >
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    poll
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {postType === "poll" ? (
                    <>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ question:
                            </label>
                            <Input
                                value={formData.question}
                                onChange={(e) =>
                                    handleInputChange(
                                        "question",
                                        e.target.value
                                    )
                                }
                                placeholder="what would you like to ask?"
                                className="font-mono border border-black rounded-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ options:
                            </label>
                            <div className="space-y-2">
                                {formData.pollOptions.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={option}
                                            onChange={(e) =>
                                                updatePollOption(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            placeholder={`option ${index + 1}`}
                                            className="flex-1 font-mono border border-black rounded-none"
                                        />
                                        {formData.pollOptions.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    removePollOption(index)
                                                }
                                                className="border border-black rounded-none"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addPollOption}
                                    className="w-full border border-black rounded-none font-mono text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-2" />
                                    add option
                                </Button>
                            </div>
                        </div>
                    </>
                ) : postType === "image" ? (
                    <>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ title:
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange("title", e.target.value)
                                }
                                className="font-mono border border-black rounded-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ image:
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setImageFile(e.target.files[0])
                                }
                                className="font-mono text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                caption (optional):
                            </label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                className="font-mono border border-black rounded-none"
                                rows={3}
                            />
                        </div>
                    </>
                ) : postType === "video" ? (
                    <>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ title:
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange("title", e.target.value)
                                }
                                className="font-mono border border-black rounded-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ video file:
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) =>
                                    setVideoFile(e.target.files[0])
                                }
                                className="font-mono text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                description:
                            </label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                className="font-mono border border-black rounded-none"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                thumbnail (optional):
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setThumbnailFile(e.target.files[0])
                                }
                                className="font-mono text-xs"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                tags:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {VIDEO_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`font-mono text-xs px-2 py-1 border border-black transition-all ${
                                            formData.tags.includes(tag)
                                                ? "bg-black text-white"
                                                : "bg-white hover:bg-gray-100"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ title:
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange("title", e.target.value)
                                }
                                className="font-mono border border-black rounded-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                ★ content:
                            </label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) =>
                                    handleInputChange("content", e.target.value)
                                }
                                className="font-mono border border-black rounded-none h-32"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-mono text-xs mb-2 block">
                                image (optional):
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setImageFile(e.target.files[0])
                                }
                                className="font-mono text-xs"
                            />
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-black text-white border border-black rounded-none font-heavy text-sm hover:bg-gray-800 disabled:bg-gray-400"
                >
                    {uploading ? "★ creating... ★" : "★ publish ★"}
                </Button>
            </form>
        </div>
    );
}
