import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { createAudioBreak } from "@/api/audio";
import { uploadAudio, getAudioPublicUrl } from "@/api/storage";
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
import { Check, FolderPlus, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BulkUploadForm from "../components/audio/BulkUploadForm";

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];
const AVAILABLE_TAGS = [
    "dry",
    "open",
    "22' kick",
    "20' kick",
    "muted",
    "tight",
    "loose",
    "compressed",
    "raw",
    "filtered",
    "heavy",
    "light",
    "vintage",
    "modern",
];

export function UploadPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [uploadMode, setUploadMode] = useState("single"); // "single" or "bulk"
    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        decade: "",
        tags: [],
        bpm: "",
        description: "",
        sticker: "none",
    });
    const [file, setFile] = useState(null);
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

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith("audio/")) {
            setFile(selectedFile);
        } else {
            alert("Please select a valid audio file (WAV, MP3, etc).");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.title || !formData.decade) {
            alert("Please fill in all required fields (File, Title, Decade).");
            return;
        }
        if (!user?.id) {
            alert("You must be logged in to upload files.");
            return;
        }

        setUploading(true);
        try {
            // Upload file to Supabase Storage
            const uploadResult = await uploadAudio(user.id, file);
            if (uploadResult.error) throw uploadResult.error;

            const filePath = uploadResult.data.path;
            const file_url = getAudioPublicUrl(filePath);

            // Create audio break record in database
            const { error } = await createAudioBreak({
                title: formData.title,
                description: formData.description,
                file_url: file_url,
                bpm: formData.bpm ? parseFloat(formData.bpm) : null,
                decade: formData.decade,
                tags: formData.tags,
                sticker: formData.sticker,
                is_folder_item: false,
            });

            if (error) throw error;

            setUploaded(true);
            setTimeout(() => navigate(createPageUrl("Library")), 1500);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleBulkUploadComplete = () => {
        navigate(createPageUrl("Library"));
    };

    if (uploaded) {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <div className="border border-black bg-white p-12">
                    <Check className="w-10 h-10 mx-auto mb-4 text-green-500" />
                    <h2 className="font-heavy text-sm mb-2 flex items-center justify-center gap-2">
                        ★ upload complete ★
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                        redirecting to archive...
                    </p>
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
        <div className="max-w-2xl mx-auto">
            {/* Upload Mode Toggle */}
            <div className="flex gap-4 mb-6">
                <Button
                    onClick={() => setUploadMode("single")}
                    className={`flex-1 h-10 rounded-none font-heavy text-sm tracking-wide transition-colors ${
                        uploadMode === "single"
                            ? "bg-black text-white border border-black"
                            : "bg-white text-black border border-black hover:bg-gray-100"
                    }`}
                >
                    <Music className="w-4 h-4 mr-2" />
                    single upload
                </Button>
                <Button
                    onClick={() => setUploadMode("bulk")}
                    className={`flex-1 h-10 rounded-none font-heavy text-sm tracking-wide transition-colors ${
                        uploadMode === "bulk"
                            ? "bg-black text-white border border-black"
                            : "bg-white text-black border border-black hover:bg-gray-100"
                    }`}
                >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    bulk upload
                </Button>
            </div>

            {uploadMode === "bulk" ? (
                <BulkUploadForm
                    onUploadComplete={handleBulkUploadComplete}
                    onCancel={() => setUploadMode("single")}
                />
            ) : (
                <div className="border border-black bg-white p-6 md:p-8">
                    <h1 className="font-heavy text-sm tracking-wide mb-6 flex items-center gap-2">
                        ★ upload new break ★
                    </h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <FormLabel required>audio file</FormLabel>
                            <div className="border border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="audio-upload"
                                />
                                <label
                                    htmlFor="audio-upload"
                                    className="cursor-pointer"
                                >
                                    {file ? (
                                        <p className="font-mono text-black text-xs">
                                            ★ {file.name} ★
                                        </p>
                                    ) : (
                                        <p className="font-mono text-gray-500 text-xs">
                                            ★ drag file here or [click] ★
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <FormLabel>artist</FormLabel>
                                <Input
                                    value={formData.artist}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "artist",
                                            e.target.value
                                        )
                                    }
                                    className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                                />
                            </div>
                            <div>
                                <FormLabel>bpm</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.bpm}
                                    onChange={(e) =>
                                        handleInputChange("bpm", e.target.value)
                                    }
                                    className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <FormLabel required>decade</FormLabel>
                                <Select
                                    value={formData.decade}
                                    onValueChange={(value) =>
                                        handleInputChange("decade", value)
                                    }
                                    required
                                >
                                    <SelectTrigger className="font-mono border border-black rounded-none h-9 text-sm">
                                        <SelectValue placeholder="select..." />
                                    </SelectTrigger>
                                    <SelectContent className="border border-black rounded-none bg-white font-mono text-sm">
                                        {DECADES.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <FormLabel>sticker</FormLabel>
                                <Select
                                    value={formData.sticker}
                                    onValueChange={(value) =>
                                        handleInputChange("sticker", value)
                                    }
                                >
                                    <SelectTrigger className="font-mono border border-black rounded-none h-9 text-sm">
                                        <SelectValue placeholder="none" />
                                    </SelectTrigger>
                                    <SelectContent className="border border-black rounded-none bg-white font-mono text-sm">
                                        <SelectItem value="none">
                                            no sticker
                                        </SelectItem>
                                        <SelectItem value="new">
                                            ★ new (yellow)
                                        </SelectItem>
                                        <SelectItem value="hot">
                                            ★ hot (red)
                                        </SelectItem>
                                        <SelectItem value="long">
                                            ★ long (blue)
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
                        <div>
                            <FormLabel>description</FormLabel>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                className="font-mono border border-black rounded-none px-3 py-2 text-sm h-20"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={uploading}
                            className="w-full h-10 bg-black text-white rounded-none font-heavy text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                            {uploading
                                ? "★ uploading... ★"
                                : "★ submit to archive ★"}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function UploadPageWithProtection() {
    return (
        <ProtectedAdminRoute>
            <UploadPage />
        </ProtectedAdminRoute>
    );
}
