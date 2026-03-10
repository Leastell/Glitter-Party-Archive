import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser(token);

        if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const userId = userData.user.id;

        const { data: subscription, error: subError } = await supabaseClient
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", userId)
            .single();

        if (subError || !subscription?.stripe_subscription_id) {
            return new Response(
                JSON.stringify({ error: "No active subscription found" }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        const stripeKey =
            Deno.env.get("STRIPE_SECRET_KEY") ||
            Deno.env.get("TEST_STRIPE_SECRET_KEY") ||
            "";
        const stripeClient = new Stripe(stripeKey, {
            apiVersion: "2023-10-16",
        });

        const canceledSubscription = await stripeClient.subscriptions.update(
            subscription.stripe_subscription_id,
            { cancel_at_period_end: true }
        );

        await supabaseClient
            .from("subscriptions")
            .update({
                status: "canceled",
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

        return new Response(
            JSON.stringify({
                success: true,
                cancelsAt: canceledSubscription.cancel_at,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    } catch (error) {
        console.error("Error canceling subscription:", error);
        return new Response(
            JSON.stringify({
                error: error?.message || "Failed to cancel subscription",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }
});
