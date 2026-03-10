# Supabase Edge Functions

This folder contains the Edge Functions used by GP Archive. They are **not** built or deployed by Vite/Vercel — they run on Supabase and must be deployed separately.

**→ For step-by-step instructions to set up automatic deployment on git push, see [DEPLOY-SETUP.md](./DEPLOY-SETUP.md).**

## Functions

| Function                  | Purpose                                                                                                           | JWT                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `create-checkout-session` | Creates Stripe Checkout session; returns session URL                                                              | Yes (user auth)          |
| `cancel-subscription`     | Cancels Stripe subscription at period end; updates DB                                                             | Yes (user auth)          |
| `stripe-webhook`          | Receives Stripe events (checkout completed, subscription updated/deleted); updates `profiles` and `subscriptions` | **No** (Stripe calls it) |

## Is the Stripe webhook necessary?

**Yes.** The other two functions do not receive Stripe events:

-   **create-checkout-session** only creates a session and redirects the user to Stripe. When the user completes payment, Stripe sends `checkout.session.completed` to your **webhook URL** — nothing else in your app gets that event unless you have a webhook.
-   **cancel-subscription** runs when the user clicks “Cancel” in your app; it does not run when Stripe later ends the subscription (e.g. at period end or after failed payment).

Without the webhook, after a user pays or a subscription changes, your database (and thus the app) would never update. The webhook is what keeps `profiles.subscription_status` and the `subscriptions` table in sync with Stripe.

The old webhook you had used Base44 (`createClientFromRequest`, `base44.asServiceRole.entities.User`). The new `stripe-webhook` function in this repo uses **Supabase only**: it updates `profiles` and `subscriptions` with the service role client.

## Required env (Supabase Dashboard → Project Settings → Edge Functions)

Set these secrets for each function that needs them:

**All three:**

-   `SUPABASE_URL` — usually set automatically when deployed via Supabase.
-   `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API.

**create-checkout-session:**

-   `TEST_STRIPE_SECRET_KEY` (or `STRIPE_SECRET_KEY`) — Stripe secret key.

**cancel-subscription:**

-   `STRIPE_SECRET_KEY` — Stripe secret key.

**stripe-webhook:**

-   `STRIPE_SECRET_KEY` — same Stripe secret key (must match the key used to create subscriptions).
-   `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Developers → Webhooks → your endpoint → “Signing secret”.

## Stripe webhook URL

After deploying `stripe-webhook`:

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
3. Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the **Signing secret** and set it as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets.

## Deploy (manual)

1. Install Supabase CLI: `npm i -g supabase` or see [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Log in and link the project:
    ```bash
    supabase login
    supabase link --project-ref YOUR_PROJECT_REF
    ```
3. Deploy all functions:
    ```bash
    supabase functions deploy create-checkout-session
    supabase functions deploy cancel-subscription
    supabase functions deploy stripe-webhook --no-verify-jwt
    ```

## Deploy on git push (CI)

Edge functions are **not** deployed when you push to Git unless you add a CI step.

1. **GitHub Actions** (example): in `.github/workflows/deploy-functions.yml`, run `supabase functions deploy ...` on push to `main`, using `SUPABASE_ACCESS_TOKEN` (from Supabase Dashboard → Account → Access Tokens) for auth.
2. Or use Supabase’s [GitHub integration](https://supabase.com/docs/guides/platform/github-integration) if available for your project.

Example workflow step:

```yaml
- name: Deploy Edge Functions
  run: |
      npx supabase functions deploy create-checkout-session
      npx supabase functions deploy cancel-subscription
      npx supabase functions deploy stripe-webhook --no-verify-jwt
  env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

(You may need to link the project in CI or pass `--project-ref`.)

## Cancel from the app

When the user clicks “Cancel subscription” in your app, you should call the **cancel-subscription** Edge Function (so Stripe is updated), not only the direct DB update. In `src/api/subscriptions.js` you have:

-   **cancelSubscription(userId)** — updates only the `subscriptions` table (no Stripe call).
-   **invokeCancelSubscription()** — calls the **cancel-subscription** Edge Function (Stripe + DB).

Use **invokeCancelSubscription()** from the Manage Subscription page, then refresh the user profile (e.g. `updateProfile({ subscription_status: "free", stripe_subscription_id: null })` or refetch user). That way Stripe is told to cancel at period end and your DB stays in sync.

## Database expectations (webhook)

The `stripe-webhook` function assumes:

-   **profiles**: columns `id`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `updated_at`. If any are missing, add them (e.g. via Supabase migrations).
-   **subscriptions**: table with `user_id` (unique), `stripe_subscription_id`, `stripe_customer_id`, `status`, `cancel_at_period_end`, `updated_at`. Upsert uses `onConflict: "user_id"`, so there should be a unique constraint on `user_id`.
