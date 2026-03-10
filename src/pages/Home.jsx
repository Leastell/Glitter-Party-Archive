import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Unlock } from "lucide-react";
import {
    getArchiveBannerUrl,
    getStorageUrl,
    ASSET_PATHS,
} from "@/config/assets";

export default function HomePage() {
    const navigate = useNavigate();
    const { user, loading, signInWithGoogle, updateProfile } = useAuth();
    const imageUrl = getArchiveBannerUrl();

    const handleFreeAccess = async () => {
        if (user) {
            await updateProfile({ subscription_status: "free" });
            navigate(createPageUrl("Library"));
        } else {
            // Redirect to root so Supabase can properly handle the OAuth callback
            await signInWithGoogle(window.location.origin + "/");
        }
    };

    const handleSubscriberAccess = () => {
        navigate(createPageUrl("Subscribe"));
    };

    const handleEnterArchive = () => {
        navigate(createPageUrl("Library"));
    };

    if (loading) {
        return (
            <div className="bg-slate-50 flex items-center justify-center h-screen">
                <div className="font-mono text-xs animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    const hasChosenTier =
        user &&
        user.subscription_status &&
        user.subscription_status !== "unauthenticated";

    return (
        <div className="bg-slate-50 flex items-center justify-center min-h-screen p-6">
            <div className="max-w-4xl w-full">
                {hasChosenTier ? (
                    <div className="text-center">
                        {/* Removed the welcome message */}
                        <div
                            onClick={handleEnterArchive}
                            className="cursor-pointer hover:opacity-90 transition-opacity inline-block"
                        >
                            <img
                                src={imageUrl}
                                alt="Enter Archive"
                                className="max-w-3xl w-full h-auto mx-auto max-h-[85vh] object-contain"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <img
                                src={getStorageUrl(ASSET_PATHS.musicNotesIcon)}
                                alt="Music Notes"
                                className="mx-auto my-1 w-16 h-16 object-contain"
                            />
                            <h2 className="font-heavy text-2xl">
                                choose your access level
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-2 border-black bg-white p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-center gap-2 mb-4">
                                    <Unlock className="w-6 h-6" />
                                    <h3 className="font-heavy text-xl">
                                        free access
                                    </h3>
                                </div>
                                <ul className="font-mono text-xs space-y-2 mb-6">
                                    <li>★ access 5 random drum breaks</li>
                                    <li>★ download available samples</li>
                                    <li>★ browse the archive</li>
                                </ul>
                                <Button
                                    onClick={handleFreeAccess}
                                    className="w-full bg-white text-black border-2 border-black rounded-none font-heavy text-sm py-4 hover:bg-gray-100"
                                >
                                    get free access
                                </Button>
                            </div>

                            <div className="border-2 border-orange-500 bg-gradient-to-br from-yellow-50 to-orange-100 p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-heavy text-xl text-orange-900">
                                        become a subscriber
                                    </h3>
                                </div>
                                <ul className="font-mono text-xs space-y-2 mb-6 text-orange-900">
                                    <li>★ unlimited drum breaks</li>
                                    <li>★ download all samples</li>
                                    <li>
                                        ★ full video archive access - process
                                        and recording breakdowns
                                    </li>
                                    <li>★ new drum breaks added weekly</li>
                                    <li>★ participate in discussions</li>
                                    <li>★ support the archive</li>
                                </ul>
                                <Button
                                    onClick={handleSubscriberAccess}
                                    className="w-full bg-orange-600 text-white border-2 border-orange-600 rounded-none font-heavy text-sm py-4 hover:bg-orange-700"
                                >
                                    subscribe now
                                </Button>
                            </div>
                        </div>

                        {!user && (
                            <p className="font-mono text-xs text-center text-gray-600 mt-4">
                                you&apos;ll need to log in with google to
                                continue
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
