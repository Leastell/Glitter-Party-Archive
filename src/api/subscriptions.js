import { supabase } from "./supabaseClient";

/**
 * Get subscription for current user
 */
export async function getUserSubscription(userId) {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .single();

        // No error if not found - just return null
        if (error && error.code !== "PGRST116") throw error;
        return { data: data || null, error: null };
    } catch (error) {
        console.error("Error fetching user subscription:", error);
        return { data: null, error };
    }
}

/**
 * Create a new subscription
 * Note: This should typically only be called by backend/Edge Functions
 */
export async function createSubscription(userId, subscriptionData) {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .insert([
                {
                    user_id: userId,
                    ...subscriptionData,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating subscription:", error);
        return { data: null, error };
    }
}

/**
 * Update subscription
 * Note: This should typically only be called by backend/Edge Functions
 */
export async function updateSubscription(userId, updates) {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating subscription:", error);
        return { data: null, error };
    }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(userId, status) {
    return updateSubscription(userId, { status });
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId) {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

        if (error && error.code !== "PGRST116") throw error;
        return { isActive: !!data, error: null };
    } catch (error) {
        console.error("Error checking active subscription:", error);
        return { isActive: false, error };
    }
}

/**
 * Cancel subscription
 * Note: This should be called by backend/Edge Functions
 */
export async function cancelSubscription(userId) {
    try {
        const { data, error } = await supabase
            .from("subscriptions")
            .update({
                status: "canceled",
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error canceling subscription:", error);
        return { data: null, error };
    }
}

/**
 * Invoke Supabase Edge Function to create Stripe checkout session
 */
export async function createStripeCheckoutSession(
    priceId,
    successUrl,
    cancelUrl
) {
    try {
        const { data, error } = await supabase.functions.invoke(
            "create-checkout-session",
            {
                body: {
                    priceId,
                    successUrl,
                    cancelUrl,
                },
            }
        );

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return { data: null, error };
    }
}

/**
 * Invoke Supabase Edge Function to cancel subscription
 */
export async function invokeCancelSubscription() {
    try {
        const { data, error } = await supabase.functions.invoke(
            "cancel-subscription"
        );

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error invoking cancel subscription function:", error);
        return { data: null, error };
    }
}
