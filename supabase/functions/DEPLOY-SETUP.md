# Set up automatic deployment of Edge Functions

This doc explains how to get **GitHub to run an action that deploys your Supabase Edge Functions when you push to main**, and how to configure it.

---

## How the action runs when you push to main

GitHub Actions runs workflows that **live in your repo**. This project includes a workflow file that tells GitHub what to do:

-   **File:** `.github/workflows/deploy-supabase-functions.yml`

**To make the action run on push to main:**

1. **Have that file on your `main` branch.**  
   If you just added it (or got it from a branch), commit it and push to `main`:

    ```bash
    git add .github/workflows/deploy-supabase-functions.yml
    git commit -m "ci: add workflow to deploy Supabase Edge Functions on push to main"
    git push origin main
    ```

2. **Add the two secrets** (see step 3 below). Without them, the workflow run will fail.

3. **That’s it.**  
   Once the workflow file is on `main` and the secrets exist:
    - Every **push to `main`** that changes something under `supabase/functions/` (or the workflow file) will **automatically** trigger a run.
    - You’ll see it under the **Actions** tab as **“Deploy Supabase Edge Functions”**.
    - You can also run it manually: Actions → Deploy Supabase Edge Functions → Run workflow.

There is **no** separate “enable Actions” or “connect Supabase” step in the GitHub UI. Putting the file on `main` and adding the secrets is enough.

---

## 1. Get your Supabase project reference

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Project Settings** (gear icon) → **General**.
3. Copy **Reference ID** (e.g. `abcdefghijklmnop`).  
   You can also get it from your project URL: `https://app.supabase.com/project/<REF>` or `https://<REF>.supabase.co`.

This is your **SUPABASE_PROJECT_REF**.

---

## 2. Create a Supabase access token

1. In Supabase Dashboard, click your **profile/avatar** (top right) → **Account** (or go to [Supabase Account](https://supabase.com/dashboard/account)).
2. Open **Access Tokens**.
3. Click **Generate new token**.
4. Name it (e.g. `GitHub Actions – gp-archive`).
5. Copy the token and store it somewhere safe (you won’t see it again).

This is your **SUPABASE_ACCESS_TOKEN**.

---

## 3. Add GitHub repository secrets

The workflow needs two **repository secrets** so it can deploy to your Supabase project.

### 3.1 Open your repo’s Actions secrets

1. On **GitHub**, open your **gp-archive** repository.
2. Click the **Settings** tab (repo settings, not your user/org settings).
3. In the left sidebar, under **Security**, click **Secrets and variables** → **Actions**.

You should see a list of “Repository secrets” (it may be empty).

### 3.2 Add the first secret: `SUPABASE_ACCESS_TOKEN`

1. Click **New repository secret**.
2. **Name:** type exactly: `SUPABASE_ACCESS_TOKEN`
3. **Secret:** paste the access token you created in step 2.
4. Click **Add secret**.

### 3.3 Add the second secret: `SUPABASE_PROJECT_REF`

1. Click **New repository secret** again.
2. **Name:** type exactly: `SUPABASE_PROJECT_REF`
3. **Secret:** paste your Supabase project reference ID from step 1 (e.g. `abcdefghijklmnop` — no spaces, no `https://` or `.supabase.co`).
4. Click **Add secret**.

### 3.4 Check that both exist

Under **Repository secrets** you should see:

-   `SUPABASE_ACCESS_TOKEN`
-   `SUPABASE_PROJECT_REF`

You cannot view their values after saving. Do **not** commit these values anywhere.

---

## 4. Confirm Edge Function secrets in Supabase

The **code** is deployed by GitHub Actions. **Secrets** (Stripe keys, etc.) are set in Supabase:

1. In Supabase Dashboard → your project → **Project Settings** → **Edge Functions**.
2. Ensure these are set (per function as in the main README):
    - **All functions:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
    - **create-checkout-session:** `TEST_STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY`
    - **cancel-subscription:** `STRIPE_SECRET_KEY`
    - **stripe-webhook:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

GitHub Actions does **not** inject these; Supabase does when the function runs.

---

## 5. Trigger a deploy

-   **Automatic:** Push to `main` with changes under `supabase/functions/` or `.github/workflows/deploy-supabase-functions.yml`. The workflow will run and deploy.
-   **Manual:** On GitHub go to the **Actions** tab → **Deploy Supabase Edge Functions** → **Run workflow** → choose branch `main` → **Run workflow**. Check the run to confirm the “Deploy Edge Functions” job succeeds.

---

## 6. Check that it worked

1. **Actions tab:** Open the latest run; the “Deploy Edge Functions” job should be green.
2. **Supabase:** Dashboard → **Edge Functions**. You should see your functions with recent deploy times.
3. **Stripe webhook:** After the first deploy, in Stripe Dashboard → Webhooks, set the endpoint URL to  
   `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`  
   and use the signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets.

---

## Troubleshooting

-   **“Invalid project ref” / 404:** Double-check `SUPABASE_PROJECT_REF` (no spaces, correct project).
-   **“Unauthorized” / 401:** Regenerate `SUPABASE_ACCESS_TOKEN` and update the GitHub secret.
-   **Workflow doesn’t run on push:** Ensure `.github/workflows/deploy-supabase-functions.yml` is on your `main` branch and your push changed `supabase/functions/` or that workflow file.
-   **Function runs but missing env:** Secrets are set in Supabase (Project Settings → Edge Functions), not in GitHub.
-   **Webhook returns 401:** Deploy the webhook with `--no-verify-jwt` (the workflow already does this for `stripe-webhook`).
