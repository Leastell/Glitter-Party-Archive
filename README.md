# GP Archive

Notion: https://www.notion.so/Glitter-Party-Archive-2e4394be5f7c806d95dbe0d0887f45f4

GP Archive is a React + Vite web app deployed on **Vercel**, backed by **Supabase** (Auth, Postgres, Storage, Edge Functions) and **Stripe** (subscriptions).

## Tech stack

- **Frontend**: React, Vite, Tailwind, shadcn/ui
- **Hosting (frontend)**: Vercel
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe (Checkout + webhooks)
- **Edge Functions (Stripe glue)**: Supabase Edge Functions (Deno)

## Access / accounts

- **Vercel**: access is managed in the Vercel dashboard for the Vercel project/team (ask an admin to invite you).
- **Supabase**: access is managed in the Supabase dashboard for the Supabase project/org (ask an admin to invite you).
    - **Note**: the Supabase project may **pause after ~1 week of inactivity** (no usage at all). If the app suddenly stops working, check the Supabase dashboard and resume/unpause the project.
- **Stripe**: access is managed in Stripe dashboard (ask an admin to invite you). Webhook failures usually mean the webhook endpoint URL and/or signing secret need attention.

## Local development

### Prereqs

- Node.js (use an LTS version)
- npm

### Install and run

```bash
npm install
npm run dev
```

### Environment variables

Create `.env.local` (gitignored) based on `.env.local.example`, then restart `npm run dev` after edits.

Required for the frontend:

- **`VITE_SUPABASE_URL`**: Supabase project URL
- **`VITE_SUPABASE_ANON_KEY`**: Supabase anon/public key
- **`VITE_STRIPE_PRICE_ID`**: Stripe Price ID for the subscription product
- **`VITE_PUBLIC_STORAGE_BASE`**: public base URL for images (example: `https://<project-ref>.supabase.co/storage/v1/object/public/images`)
- **`VITE_CUSTOM_FONT_URL`**: optional public URL to a `.ttf` font (leave empty to use defaults)

## Supabase Edge Functions (Stripe)

The Stripe integration relies on Supabase Edge Functions in `supabase/functions/`:

- `create-checkout-session`
- `cancel-subscription`
- `stripe-webhook` (required to sync subscription state after Checkout + Stripe subscription changes)

### Deploying Edge Functions

- **Automatic deploy (GitHub Actions)**: this repo includes `.github/workflows/deploy-supabase-functions.yml`, which deploys on pushes to `main` affecting `supabase/functions/**`.
    - Requires GitHub repo secrets: `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`.
- **Manual deploy**: see `supabase/functions/DEPLOY-SETUP.md`.

### Stripe webhook endpoint

After deploying `stripe-webhook`, configure the Stripe webhook endpoint to:

- `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`

and set `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets. Details: `supabase/functions/README.md`.

## Contributing

### Workflow

- Create a branch from `main`.
- Keep secrets out of git:
    - **Never** commit `.env.local`.
    - Keep `.env.local.example` as placeholders only.
- Make changes with small, reviewable commits (unless you’re intentionally squashing for a PR).
- Open a PR to `main` with a clear summary + test plan.

### Quality checks

```bash
npm run lint
npm run build
```

## Docs

- `SETUP-CHECKLIST.md`: getting the app running + Stripe/Supabase setup notes
- `supabase/functions/DEPLOY-SETUP.md`: CI + manual Edge Function deploy steps
- `AUDIT.md`: project audit and recommended improvements
