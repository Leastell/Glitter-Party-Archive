import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { createStripeCheckoutSession } from "@/api/subscriptions";
import { getStorageUrl, ASSET_PATHS } from "@/config/assets";

export default function SubscribePage() {
    const navigate = useNavigate();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(true);
    const [processingCheckout, setProcessingCheckout] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            // If user is already a subscriber, redirect to library
            if (user && user.subscription_status === "subscriber") {
                navigate(createPageUrl("Library"));
            }
            setLoading(false);
        }
    }, [authLoading, user, navigate]);

    const handleSubscribe = async () => {
        // Require login first
        if (!user) {
            // Redirect to root so Supabase can properly handle the OAuth callback
            await signInWithGoogle(window.location.origin + "/");
            return;
        }

        setProcessingCheckout(true);

        try {
            const successUrl =
                window.location.origin + createPageUrl("SubscriptionSuccess");
            const cancelUrl =
                window.location.origin + createPageUrl("SubscriptionCancelled");

            const { data, error } = await createStripeCheckoutSession(
                import.meta.env.VITE_STRIPE_PRICE_ID,
                successUrl,
                cancelUrl
            );

            if (error) {
                throw error;
            }

            // Redirect to Stripe Checkout
            if (data?.sessionUrl) {
                window.location.href = data.sessionUrl;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error) {
            console.error("Error initiating checkout:", error);
            alert("Failed to start checkout. Please try again.");
            setProcessingCheckout(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="font-mono text-xs animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="border-2 border-black bg-white p-8 md:p-12">
                <div className="text-center mb-8">
                    <img
                        src={getStorageUrl(ASSET_PATHS.musicNotesIcon)}
                        alt="Premium"
                        className="w-20 h-20 mx-auto mb-4 object-contain"
                    />
                    <h1 className="font-heavy text-3xl mb-4">
                        become a subscriber
                    </h1>
                    <p className="font-mono text-sm text-gray-600">
                        unlock unlimited access to the glitter party archive
                    </p>
                </div>

                <div className="bg-gray-50 border-2 border-black p-6 mb-8">
                    <h2 className="font-heavy text-lg mb-4">
                        what&apos;s included:
                    </h2>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="font-mono text-sm">
                                unlimited drum breaks - download all samples
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="font-mono text-sm">
                                full video archive access - process and
                                recording breakdowns
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="font-mono text-sm">
                                weekly updates - new drum breaks added regularly
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="font-mono text-sm">
                                participate in discussions - connect with the
                                community
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-block bg-yellow-100 border-2 border-yellow-400 px-6 py-4">
                        <p className="font-heavy text-2xl mb-1">$9.99/month</p>
                        <p className="font-mono text-xs text-gray-600">
                            cancel anytime
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleSubscribe}
                    disabled={processingCheckout}
                    className="w-full h-14 bg-black text-white border-2 border-black rounded-none font-heavy text-lg tracking-wide hover:bg-gray-800 disabled:bg-gray-400"
                >
                    {processingCheckout
                        ? "★ processing... ★"
                        : "★ subscribe now ★"}
                </Button>

                <p className="font-mono text-xs text-center text-gray-500 mt-6">
                    secure payment powered by stripe
                </p>

                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate(createPageUrl("Home"))}
                        className="font-mono text-xs underline hover:text-gray-600"
                    >
                        ← back to home
                    </button>
                </div>
            </div>
        </div>
    );
}
