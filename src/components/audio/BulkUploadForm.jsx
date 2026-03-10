import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { createAudioBreak } from "@/api/audio";
import { uploadAudio, getAudioPublicUrl } from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];

export default function BulkUploadForm({ onUploadComplete, onCancel }) {
    const { user } = useAuth();
    const [folderName, setFolderName] = useState("");
    const [selectedDecades, setSelectedDecades] = useState([]);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploaded, setUploaded] = useState(false);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const audioFiles = selectedFiles.filter((file) =>
            file.type.startsWith("audio/")
        );

        if (audioFiles.length !== selectedFiles.length) {
            alert(
                "Some files were not audio files and have been filtered out."
            );
        }

        setFiles(audioFiles);
    };

    const toggleDecade = (decade) => {
        setSelectedDecades((prev) =>
            prev.includes(decade)
                ? prev.filter((d) => d !== decade)
                : [...prev, decade]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!folderName || files.length === 0 || selectedDecades.length === 0) {
            alert(
                "Please fill in folder name, select files, and choose at least one decade."
            );
            return;
        }

        if (!user?.id) {
            alert("You must be logged in to upload files.");
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Upload file to Supabase Storage
                const uploadResult = await uploadAudio(user.id, file);
                if (uploadResult.error) throw uploadResult.error;

                const file_url = getAudioPublicUrl(uploadResult.data.path);

                // Randomly assign a decade from the selected ones
                const randomDecade =
                    selectedDecades[
                        Math.floor(Math.random() * selectedDecades.length)
                    ];

                // Create audio break record
                const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                const { error } = await createAudioBreak({
                    title: fileName,
                    file_url,
                    decade: randomDecade,
                    folder_name: folderName,
                    is_folder_item: true,
                    tags: [],
                    sticker: "none",
                    created_by_id: user.id,
                });

                if (error) throw error;

                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
            }

            setUploaded(true);
            setTimeout(() => {
                onUploadComplete();
            }, 1500);
        } catch (error) {
            console.error("Bulk upload failed:", error);
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
                        ★ folder uploaded ★
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                        {files.length} files uploaded successfully
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

    return (
        <div className="border border-black bg-white p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-heavy text-sm tracking-wide">
                    ★ bulk upload folder ★
                </h2>
                <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <FormLabel required>folder name</FormLabel>
                    <Input
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="e.g. vintage collection"
                        className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                        required
                    />
                </div>

                <div>
                    <FormLabel required>
                        decade(s) (randomly assigned to files)
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                        {DECADES.map((d) => (
                            <button
                                type="button"
                                key={d}
                                onClick={() => toggleDecade(d)}
                                className={`font-mono text-xs px-2 py-1 border border-black transition-all duration-150 ${
                                    selectedDecades.includes(d)
                                        ? "bg-black text-white"
                                        : "bg-white hover:bg-gray-100"
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <FormLabel required>audio files</FormLabel>
                    <div className="border border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            multiple
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="bulk-audio-upload"
                        />
                        <label
                            htmlFor="bulk-audio-upload"
                            className="cursor-pointer"
                        >
                            {files.length > 0 ? (
                                <div>
                                    <p className="font-mono text-black text-xs mb-2">
                                        ★ {files.length} files selected ★
                                    </p>
                                    <div className="max-h-20 overflow-y-auto">
                                        {files
                                            .slice(0, 5)
                                            .map((file, index) => (
                                                <p
                                                    key={index}
                                                    className="font-mono text-xs text-gray-600"
                                                >
                                                    {file.name}
                                                </p>
                                            ))}
                                        {files.length > 5 && (
                                            <p className="font-mono text-xs text-gray-400">
                                                ...and {files.length - 5} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="font-mono text-gray-500 text-xs">
                                    ★ drag multiple audio files here or [click]
                                    ★
                                </p>
                            )}
                        </label>
                    </div>
                </div>

                {uploading && (
                    <div className="bg-gray-100 border border-black p-4">
                        <p className="font-mono text-xs mb-2">
                            uploading... {uploadProgress}%
                        </p>
                        <div className="w-full bg-gray-200 border border-black h-2">
                            <div
                                className="bg-black h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={uploading || files.length === 0}
                    className="w-full h-10 bg-black text-white rounded-none font-heavy text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                    {uploading
                        ? `★ uploading ${uploadProgress}%... ★`
                        : `★ upload ${files.length} files ★`}
                </Button>
            </form>
        </div>
    );
}
