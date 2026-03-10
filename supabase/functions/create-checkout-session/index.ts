import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        const authHeader =
            req.headers.get("authorization") ||
            req.headers.get("Authorization");
        const contentType =
            req.headers.get("content-type") || req.headers.get("Content-Type");

        if (!authHeader) {
            return new Response(
                JSON.stringify({
                    error: "Missing Authorization header",
                    gotHeaders: {
                        contentType,
                        hasApikey: !!req.headers.get("apikey"),
                    },
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        const { priceId, successUrl, cancelUrl } = await req.json();

        const isHttpUrl = (s: string) => {
            try {
                const u = new URL(s);
                return u.protocol === "http:" || u.protocol === "https:";
            } catch {
                return false;
            }
        };

        if (!priceId || !successUrl || !cancelUrl) {
            return new Response(
                JSON.stringify({
                    error: "Missing priceId, successUrl, or cancelUrl",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        if (!isHttpUrl(successUrl) || !isHttpUrl(cancelUrl)) {
            return new Response(
                JSON.stringify({
                    error: "successUrl/cancelUrl must be absolute http(s) URLs",
                    successUrl,
                    cancelUrl,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const stripeKey =
            Deno.env.get("TEST_STRIPE_SECRET_KEY") ??
            Deno.env.get("STRIPE_SECRET_KEY") ??
            "";

        if (!supabaseUrl || !serviceKey) {
            return new Response(
                JSON.stringify({
                    error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }
        if (!stripeKey) {
            return new Response(
                JSON.stringify({
                    error: "Missing TEST_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY",
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        const supabaseClient = createClient(supabaseUrl, serviceKey);

        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser(token);

        if (userError || !userData.user) {
            return new Response(
                JSON.stringify({
                    error: "Invalid token",
                    details: userError?.message,
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                }
            );
        }

        const userId = userData.user.id;
        const userEmail = userData.user.email;

        const stripeClient = new Stripe(stripeKey, {
            apiVersion: "2023-10-16",
        });

        const session = await stripeClient.checkout.sessions.create({
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "subscription",
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: userEmail,
            client_reference_id: userId,
            metadata: { userId },
        });

        return new Response(
            JSON.stringify({ sessionUrl: session.url, sessionId: session.id }),
            {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return new Response(
            JSON.stringify({
                error: error?.message || "Failed to create checkout session",
                stack: error?.stack,
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }
});
