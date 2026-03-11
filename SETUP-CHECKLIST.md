# Setup checklist (from start of conversation)

Do these in order. Skip any you’ve already done.

---

## 1. Fix images and assets (why nothing is loading)

We moved all image and font URLs into **environment variables**. If those aren’t set, `src` is empty and nothing loads.

**Do this:**

1. In the project root, create or edit **`.env.local`** (it’s gitignored).
2. Copy the contents of **`.env.local.example`** into `.env.local`.
3. Fill in **asset URLs** (and any other placeholders):

    - **`VITE_PUBLIC_STORAGE_BASE`**  
      Base URL for nav icons, stickers, avatar, and music-notes image (no trailing slash).  
      If your files are still in the same Supabase bucket as before, use:

        ```bash
        VITE_PUBLIC_STORAGE_BASE=https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b
        ```

        If you moved them to a new bucket, use your bucket path instead, e.g.  
        `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/YOUR_BUCKET`

    - **`VITE_ARCHIVE_BANNER_URL`**  
      Full URL for the Home hero image (“Enter Archive”).  
      If unchanged:

        ```bash
        VITE_ARCHIVE_BANNER_URL=https://uivrdoznitrdkodovsrc.supabase.co/storage/v1/object/public/images/d298d0a6-b92f-4820-9d9a-e677e36ce8c9/archive_banner.png
        ```

        Otherwise use your actual image URL.

    - **`VITE_CUSTOM_FONT_URL`**  
      Full URL for the custom `.ttf` font, or leave empty to use Work Sans.

4. Restart the dev server (`npm run dev`) so Vite picks up the new env.

After this, images and font should load again.

---

## 2. Environment variables (Supabase + Stripe)

In **`.env.local`** (see `.env.local.example`):

-   **`VITE_SUPABASE_URL`** – Supabase project URL
-   **`VITE_SUPABASE_ANON_KEY`** – Supabase anon key
-   **`VITE_STRIPE_PRICE_ID`** – Stripe Price ID for subscription
-   Plus the asset vars in section 1.

Never commit `.env.local`; it’s in `.gitignore`.

---

## 3. Base44 removed (already done in code)

-   Package name is **`gp-archive`**; **`@base44/sdk`** removed.
-   Subscriptions use **Supabase only** (`src/api/subscriptions.js` + Edge Functions).
-   **ManageSubscription** calls **`cancelSubscription(user.id)`** (bug fix).

Nothing else for you to do here.

---

## 4. Supabase Edge Functions (Stripe + deploy)

**4a. Deploy the functions**

-   Either use the **GitHub Action** (section 6) to deploy on push to `main`, or deploy manually:
    ```bash
    npx supabase login
    npx supabase link --project-ref YOUR_PROJECT_REF
    npx supabase functions deploy create-checkout-session
    npx supabase functions deploy cancel-subscription
    npx supabase functions deploy stripe-webhook --no-verify-jwt
    ```

**4b. Set Edge Function secrets in Supabase**

In Supabase Dashboard → your project → **Project Settings** → **Edge Functions**, set:

-   All: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
-   create-checkout-session: `TEST_STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY`
-   cancel-subscription: `STRIPE_SECRET_KEY`
-   stripe-webhook: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## 5. Stripe webhook (so subscription status updates)

1. **Deploy** the **stripe-webhook** function (see 4a).
2. In **Stripe Dashboard** → Developers → Webhooks → **Add endpoint**:
    - **URL:** `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
    - **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the **Signing secret** and set it in Supabase Edge Function secrets as **`STRIPE_WEBHOOK_SECRET`** (see 4b).

Without this, Stripe can’t notify your app and subscription status won’t update after payment.

---

## 6. GitHub Actions (deploy functions on push to main)

1. **Supabase project ref**  
   Supabase Dashboard → Project Settings → General → **Reference ID**.

2. **Supabase access token**  
   Supabase Dashboard → profile → **Account** → **Access Tokens** → Generate new token.

3. **GitHub repo secrets**  
   Repo on GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

    - **`SUPABASE_ACCESS_TOKEN`** = token from step 2
    - **`SUPABASE_PROJECT_REF`** = ref from step 1

4. **Workflow on `main`**  
   The workflow file is **`.github/workflows/deploy-supabase-functions.yml`**.  
   It must be on your **`main`** branch. If it’s only on a branch (e.g. `chore/lint-and-cleanup`), merge that branch into `main` and push.

After that, pushes to `main` that change `supabase/functions/` (or the workflow file) will run the action and deploy. See **`supabase/functions/DEPLOY-SETUP.md`** for more detail.

---

## 7. Optional / later

-   **Cancel from app:** Prefer **`invokeCancelSubscription()`** (Edge Function) over **`cancelSubscription(user.id)`** (direct DB) so Stripe is updated; see `supabase/functions/README.md`.
-   **AUDIT.md** – List of improvements and phased plan; use as you refactor.
-   **Lint:** `npm run lint` – we fixed lint; only warnings left (e.g. react-refresh).

---

## Quick reference: why images broke

| What we changed                                     | What you need to do                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Replaced hardcoded image URLs with env-based config | Set `VITE_PUBLIC_STORAGE_BASE`, `VITE_ARCHIVE_BANNER_URL`, and optionally `VITE_CUSTOM_FONT_URL` in `.env.local` (see section 1). |
| Removed Base44; assets still in Supabase            | Use your Supabase storage base URL (same bucket as before or new one).                                                            |
