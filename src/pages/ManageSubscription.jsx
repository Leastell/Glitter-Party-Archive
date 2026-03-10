import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cancelSubscription } from "@/api/subscriptions";
import { updateProfile } from "@/api/auth";

export default function ManageSubscriptionPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate(createPageUrl("Home"));
            }
            setLoading(false);
        }
    }, [authLoading, user, navigate]);

    const handleCancelSubscription = async () => {
        setCancelling(true);
        try {
            const { error: cancelError } = await cancelSubscription(user.id);

            if (cancelError) {
                throw cancelError;
            }

            // Update local user state
            const { error: updateError } = await updateProfile({
                subscription_status: "free",
                stripe_subscription_id: null,
            });

            if (updateError) {
                throw updateError;
            }

            alert(
                "Your subscription has been cancelled. You will retain access until the end of your billing period."
            );
            navigate(createPageUrl("Home"));
        } catch (error) {
            console.error("Cancellation failed:", error);
            alert(
                "Failed to cancel subscription. Please try again or contact support."
            );
        } finally {
            setCancelling(false);
            setShowCancelConfirm(false);
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

    const isSubscriber = user?.subscription_status === "subscriber";
    const isFree = user?.subscription_status === "free";

    return (
        <div className="max-w-3xl mx-auto">
            <div className="border-2 border-black bg-white p-8 md:p-12">
                <div className="text-center mb-8">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h1 className="font-heavy text-3xl mb-2">
                        manage subscription
                    </h1>
                    <p className="font-mono text-sm text-gray-600">
                        {user?.email}
                    </p>
                </div>

                {/* Current Status */}
                <div className="bg-gray-50 border-2 border-black p-6 mb-8">
                    <h2 className="font-heavy text-lg mb-4">current status</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">tier:</span>
                            <span
                                className={`font-heavy text-sm px-3 py-1 border border-black ${
                                    isSubscriber
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {isSubscriber
                                    ? "★ subscriber"
                                    : isFree
                                    ? "free tier"
                                    : "unauthenticated"}
                            </span>
                        </div>
                        {isSubscriber && (
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">
                                    price:
                                </span>
                                <span className="font-heavy text-sm">
                                    $9.99/month
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Subscriber Actions */}
                {isSubscriber && (
                    <div className="space-y-6">
                        <div className="border-2 border-yellow-400 bg-yellow-50 p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-heavy text-sm mb-2">
                                        cancel subscription
                                    </h3>
                                    <p className="font-mono text-xs text-gray-700 mb-4">
                                        if you cancel, you&apos;ll retain access
                                        until the end of your current billing
                                        period. after that, your account will be
                                        downgraded to the free tier.
                                    </p>
                                </div>
                            </div>

                            {!showCancelConfirm ? (
                                <Button
                                    onClick={() => setShowCancelConfirm(true)}
                                    variant="outline"
                                    className="w-full h-10 border-2 border-red-600 text-red-600 rounded-none font-heavy text-sm hover:bg-red-50"
                                >
                                    cancel subscription
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="font-mono text-xs text-center text-red-600 font-bold">
                                        are you sure you want to cancel?
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() =>
                                                setShowCancelConfirm(false)
                                            }
                                            variant="outline"
                                            className="flex-1 h-10 border-2 border-black rounded-none font-heavy text-sm hover:bg-gray-100"
                                        >
                                            keep subscription
                                        </Button>
                                        <Button
                                            onClick={handleCancelSubscription}
                                            disabled={cancelling}
                                            className="flex-1 h-10 bg-red-600 text-white border-2 border-red-600 rounded-none font-heavy text-sm hover:bg-red-700 disabled:bg-gray-400"
                                        >
                                            {cancelling
                                                ? "cancelling..."
                                                : "yes, cancel"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Free Tier Upgrade */}
                {isFree && (
                    <div className="border-2 border-orange-500 bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-heavy text-sm mb-2 text-orange-900">
                                    upgrade to subscriber
                                </h3>
                                <p className="font-mono text-xs text-orange-800 mb-4">
                                    unlock unlimited access to all drum breaks,
                                    videos, and discussions for just
                                    $9.99/month.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(createPageUrl("Subscribe"))}
                            className="w-full h-10 bg-orange-600 text-white border-2 border-orange-600 rounded-none font-heavy text-sm hover:bg-orange-700"
                        >
                            ★ upgrade now ★
                        </Button>
                    </div>
                )}

                {/* Back Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate(createPageUrl("Library"))}
                        className="font-mono text-xs underline hover:text-gray-600"
                    >
                        ← back to archive
                    </button>
                </div>
            </div>
        </div>
    );
}
