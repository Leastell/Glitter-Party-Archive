import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { uploadImage, getImagePublicUrl } from "@/api/storage";
import { updateProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, Check, Settings, RefreshCw } from "lucide-react";

export default function ThemeSettings() {
    const { user, loading: authLoading } = useAuth();
    const [fontFile, setFontFile] = useState(null);
    const [fontName, setFontName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [themeSettings, setThemeSettings] = useState({
        font_family: "default",
        custom_font_url: null,
        custom_font_name: null,
    });

    useEffect(() => {
        if (!authLoading && user) {
            loadUserData();
        }
    }, [authLoading, user]);

    const loadUserData = async () => {
        try {
            if (user.theme_settings?.custom_font_name) {
                setFontName(user.theme_settings.custom_font_name);
            }
            setThemeSettings(
                user.theme_settings || {
                    font_family: "default",
                    custom_font_url: null,
                    custom_font_name: null,
                }
            );
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = [".woff", ".woff2", ".ttf", ".otf"];
            const isValid = validTypes.some((type) =>
                file.name.toLowerCase().endsWith(type)
            );

            if (isValid) {
                setFontFile(file);
                if (!fontName) {
                    // Auto-generate font name from filename
                    const baseName = file.name
                        .replace(/\.[^/.]+$/, "")
                        .replace(/[-_]/g, " ");
                    setFontName(baseName);
                }
                setMessage("");
            } else {
                setMessage(
                    "Please select a valid font file (.woff, .woff2, .ttf, or .otf)"
                );
                setFontFile(null);
            }
        }
    };

    const handleUploadFont = async () => {
        if (!fontFile || !fontName.trim()) {
            setMessage("Please select a font file and enter a font name");
            return;
        }

        setUploading(true);
        setMessage("");

        try {
            const { data: uploadData, error: uploadError } = await uploadImage(
                user.id,
                fontFile
            );

            if (uploadError) {
                throw uploadError;
            }

            const fontUrl = await getImagePublicUrl(uploadData.path);

            const updatedSettings = {
                ...themeSettings,
                custom_font_url: fontUrl,
                custom_font_name: fontName.trim(),
                font_family: "custom",
            };

            const { error: updateError } = await updateProfile({
                theme_settings: updatedSettings,
            });

            if (updateError) {
                throw updateError;
            }

            setThemeSettings(updatedSettings);
            setMessage(
                "✓ Font uploaded successfully! Refresh the page to see changes."
            );
            setFontFile(null);
        } catch (error) {
            console.error("Font upload failed:", error);
            setMessage("Font upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleFontFamilyChange = async (value) => {
        try {
            const updatedSettings = {
                ...themeSettings,
                font_family: value,
            };

            const { error } = await updateProfile({
                theme_settings: updatedSettings,
            });

            if (error) {
                throw error;
            }

            setThemeSettings(updatedSettings);
            setMessage(
                "✓ Font setting updated! Refresh the page to see changes."
            );
        } catch (error) {
            console.error("Failed to update font setting:", error);
            setMessage("Failed to update font setting.");
        }
    };

    const handleResetTheme = async () => {
        try {
            const { error } = await updateProfile({
                theme_settings: {
                    font_family: "default",
                },
            });

            if (error) {
                throw error;
            }

            setThemeSettings({
                font_family: "default",
                custom_font_url: null,
                custom_font_name: null,
            });

            setMessage(
                "✓ Theme reset to default! Refresh the page to see changes."
            );
        } catch (error) {
            console.error("Failed to reset theme:", error);
            setMessage("Failed to reset theme.");
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="font-mono text-xs animate-pulse">
                    loading settings...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="border border-black bg-white p-6 md:p-8">
                <h1 className="font-heavy text-sm tracking-wide mb-6 flex items-center gap-2">
                    <Settings className="w-4 h-4" />★ theme settings ★
                </h1>

                {message && (
                    <div
                        className={`p-3 mb-6 border border-black ${
                            message.includes("✓") ? "bg-green-50" : "bg-red-50"
                        }`}
                    >
                        <p className="font-mono text-xs">{message}</p>
                    </div>
                )}

                {/* Font Family Selection */}
                <div className="mb-6">
                    <Label className="font-mono text-xs tracking-wide mb-2 block">
                        ★ active font:
                    </Label>
                    <Select
                        value={themeSettings?.font_family || "default"}
                        onValueChange={handleFontFamilyChange}
                    >
                        <SelectTrigger className="font-mono border border-black rounded-none h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border border-black rounded-none bg-white font-mono text-sm">
                            <SelectItem value="default">
                                default (work sans)
                            </SelectItem>
                            {themeSettings?.custom_font_name && (
                                <SelectItem value="custom">
                                    {themeSettings.custom_font_name.toLowerCase()}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Font Upload */}
                <div className="space-y-4">
                    <Label className="font-mono text-xs tracking-wide mb-2 block">
                        ★ upload custom font:
                    </Label>

                    <div className="border border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".woff,.woff2,.ttf,.otf"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="font-upload"
                        />
                        <label htmlFor="font-upload" className="cursor-pointer">
                            {fontFile ? (
                                <p className="font-mono text-black text-xs">
                                    ★ {fontFile.name} ★
                                </p>
                            ) : (
                                <div>
                                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                    <p className="font-mono text-gray-500 text-xs">
                                        ★ drag font file here or [click] ★
                                    </p>
                                    <p className="font-mono text-xs text-gray-400 mt-1">
                                        supports: .woff, .woff2, .ttf, .otf
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>

                    {fontFile && (
                        <div>
                            <Label className="font-mono text-xs tracking-wide mb-2 block">
                                ★ font name:
                            </Label>
                            <Input
                                value={fontName}
                                onChange={(e) => setFontName(e.target.value)}
                                placeholder="enter font display name..."
                                className="font-mono border border-black rounded-none h-9 px-3 text-sm"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={handleUploadFont}
                            disabled={
                                !fontFile || !fontName.trim() || uploading
                            }
                            className="flex-1 h-9 bg-black text-white rounded-none font-heavy text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                            {uploading ? "★ uploading... ★" : "★ upload font ★"}
                        </Button>

                        <Button
                            onClick={handleResetTheme}
                            variant="outline"
                            className="h-9 border border-black rounded-none font-heavy text-sm tracking-wide hover:bg-gray-100"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            reset
                        </Button>
                    </div>
                </div>

                {/* Current Settings Display */}
                {themeSettings && (
                    <div className="mt-8 p-4 border border-gray-300 bg-gray-50">
                        <h3 className="font-mono text-xs mb-2">
                            ★ current settings:
                        </h3>
                        <div className="font-mono text-xs space-y-1">
                            <p>
                                font family:{" "}
                                {themeSettings.font_family || "default"}
                            </p>
                            {themeSettings.custom_font_name && (
                                <p>
                                    custom font:{" "}
                                    {themeSettings.custom_font_name.toLowerCase()}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
