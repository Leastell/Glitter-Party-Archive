// Stripe webhook — updates Supabase profiles + subscriptions (no Base44).
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// Set env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (Stripe Dashboard → Webhooks → Signing secret)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        console.error("Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
        return new Response(
            JSON.stringify({ error: "Missing signature or webhook secret" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }

    let event: Stripe.Event;
    try {
        const body = await req.text();
        event = await new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            apiVersion: "2023-10-16",
        }).webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
            JSON.stringify({ error: "Webhook signature verification failed" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
        return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = (session.client_reference_id ??
                    session.metadata?.userId) as string | null;
                const customerId = session.customer as string | null;
                const subscriptionId = session.subscription as string | null;

                if (!userId) {
                    console.error(
                        "checkout.session.completed: no client_reference_id or metadata.userId"
                    );
                    return new Response(
                        JSON.stringify({ error: "Missing user id in session" }),
                        {
                            status: 400,
                            headers: {
                                "Content-Type": "application/json",
                                ...corsHeaders,
                            },
                        }
                    );
                }

                await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "subscriber",
                        stripe_customer_id: customerId ?? undefined,
                        stripe_subscription_id: subscriptionId ?? undefined,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userId);

                await supabase.from("subscriptions").upsert(
                    {
                        user_id: userId,
                        stripe_subscription_id: subscriptionId,
                        stripe_customer_id: customerId,
                        status: "active",
                        cancel_at_period_end: false,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );

                console.log("Subscription activated for user", userId);
                break;
            }

            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const subId = subscription.id;
                const status = subscription.status;
                const cancelAtPeriodEnd =
                    subscription.cancel_at_period_end ?? false;

                const newProfileStatus =
                    status === "active" ? "subscriber" : "free";

                const { data: existingSub } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_subscription_id", subId)
                    .maybeSingle();

                let userId: string | null = existingSub?.user_id ?? null;
                if (!userId) {
                    const { data: profileByCustomer } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("stripe_customer_id", customerId)
                        .maybeSingle();
                    userId = profileByCustomer?.id ?? null;
                }

                if (userId) {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_status: newProfileStatus,
                            stripe_subscription_id:
                                status === "active" ? subId : null,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", userId);

                    await supabase
                        .from("subscriptions")
                        .update({
                            status: status === "active" ? "active" : "canceled",
                            cancel_at_period_end: cancelAtPeriodEnd,
                            stripe_subscription_id: subId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("user_id", userId);
                    console.log(
                        "Subscription",
                        event.type,
                        "for user",
                        userId,
                        "status:",
                        status
                    );
                } else {
                    console.log(
                        "No user found for subscription",
                        subId,
                        "customer",
                        customerId
                    );
                }
                break;
            }

            default:
                console.log("Unhandled event type:", event.type);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response(
            JSON.stringify({ error: error?.message ?? "Processing failed" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            }
        );
    }
});
