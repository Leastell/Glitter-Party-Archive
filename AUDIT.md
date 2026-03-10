# GP Archive — Full Project Audit & Remediation Plan

**Date:** February 2025  
**Scope:** Codebase quality, structure, formatting, and industry-standard practices.

**Note:** The app has been migrated off Base44 to **Vercel + Supabase** only. All Base44 SDK and references have been removed; subscriptions use Supabase Edge Functions and tables.

---

## 1. Executive Summary

The app is a **React + Vite** front end (drum-break archive, feed, subscriptions) deployed on **Vercel** with **Supabase** (auth, DB, storage, Edge Functions). Visual identity and core flows work, but the codebase shows typical AI-generated patterns: inconsistent style, duplicated logic, and—beyond style—several **functional** issues (bugs, state/effect behavior, subscription flow clarity) that affect correctness and maintainability.

**Recommendation:** Apply the phased plan below. Phase 1 is low-risk cleanup and config; Phases 2–3 improve structure and maintainability; Phase 4 is optional hardening (tests, TypeScript). Pay attention to **§5A (Function / build)** for logic and data-flow fixes.

---

## 2. Naming & Identity Inconsistencies

| Location              | Current                 | Issue                  |
| --------------------- | ----------------------- | ---------------------- |
| `package.json` `name` | Now `"gp-archive"`      | Fixed.                 |
| Folder                | `gp-archive`            | OK.                    |
| `index.html` title    | "Glitter Party Archive" | OK — user-facing name. |

**Actions:**

-   Optionally rename `src/pages/index.jsx` to `src/pages/Routes.jsx` (or `AppRoutes.jsx`) so it’s not confused with a page component.

---

## 3. Configuration & Tooling

### 3.1 Formatting & Linting

-   **No Prettier** — Quoted strings and spacing vary (single vs double quotes, inconsistent blank lines).
-   **ESLint** — Present (flat config, React/React Hooks). No TypeScript/TSX (only one `.ts` file).
-   **Quote/style** — Mix of `'` and `"` across files.

**Actions:**

-   Add **Prettier** and a single shared config (e.g. `prettier.config.js`).
-   Add `format` (and optionally `format:check`) scripts; run Prettier on the codebase once.
-   In CI/local: run both `lint` and `format` (or `format:check`).

### 3.2 TypeScript

-   **`src/utils/index.ts`** — Only TypeScript file; rest is JS/JSX.
-   **`jsconfig.json`** — No `"allowJs"`/`"checkJs"`; paths only.

**Actions (optional, Phase 4):**

-   Either: convert `utils/index.ts` to `utils/index.js` for full JS consistency, **or**
-   Plan a gradual TS migration (e.g. `jsconfig` → `tsconfig`, new files in TS first).

### 3.3 Dead / Redundant Config

-   **`src/App.css`** — Empty but imported in `App.jsx`. Remove import and delete file, or add real styles.
-   **`index.css`** — Large block of commented-out Vite defaults (~40 lines). Remove to reduce noise.

---

## 4. Code Quality & Consistency

### 4.1 Routing & Layout

-   **`src/pages/index.jsx`** — Defines both a `PAGES` map and `_getCurrentPage(url)` to derive `currentPageName` from the path, then passes it to `Layout`. Routing is already done by `<Routes>`, so this duplicates route logic and is brittle (e.g. query strings handled manually).
-   **Layout** receives `children` (the `<Routes>`); `currentPageName` is only used for nav highlighting. Prefer deriving “current section” from the matched route (e.g. `useMatch`, or a small route config that drives both `<Route>` and nav state).

**Actions:**

-   Replace URL parsing with route-based “current page” (e.g. single source of route list, use `useLocation`/`useMatch` to get current route name).
-   Remove or simplify `PAGES` and `_getCurrentPage` once nav is driven by route config.

### 4.2 Navigation: Full Reloads vs SPA

-   **Layout.jsx** uses `window.location.href = createPageUrl(...)` for dropdown items (Manage Subscription, Theme Settings, Subscribe, Logout). That forces full page reloads and loses SPA behavior.
-   **Subscribe.jsx** uses `window.location.href = data.sessionUrl` for Stripe — that’s correct (external URL).

**Actions:**

-   Use React Router’s `<Link to={...}>` or `navigate(createPageUrl(...))` for in-app targets (Manage Subscription, Theme Settings, Subscribe).
-   Keep `window.location.href` only for external URLs (e.g. Stripe) and for logout if you intentionally want a full reload (otherwise use `navigate` after `signOut()`).

### 4.3 Unused Imports / Redundant React

-   Several files import `React` even with the new JSX transform (e.g. `AuthProvider.jsx`, `Layout.jsx`, `Library.jsx`, `Feed.jsx`). Not wrong, but unnecessary in React 17+ with `"jsx": "react-jsx"`.
-   **Layout.jsx** — Unused lucide icons: `Music`, `Camera`, `MessageSquare`, `UserIcon` (only `ChevronDown`, `Sparkles`, `Settings`, `LogOut` used). Remove unused imports.

**Actions:**

-   Remove unused `React` imports where only hooks/JSX are used.
-   Remove unused icon (and any other) imports.

### 4.4 Auth Loading State Bug

-   **ProtectedAdminRoute.jsx** — Shows loading when `user === undefined`. **AuthProvider** initializes `user` with `useState(null)`, so `user` is never `undefined`; it’s `null` when unauthenticated. The loading branch in ProtectedAdminRoute never runs. Should use auth context’s `loading` flag (expose it from AuthProvider and pass it or use it in ProtectedAdminRoute) to show loading while auth is resolving.

**Actions:**

-   Expose `loading` from `useAuth()` and in ProtectedAdminRoute show loading when `loading === true` (and optionally when `user === null` until loading is false). Fix the loading state so protected routes don’t flash “Access Denied” before auth has finished.

### 4.5 Component Naming vs File Names

-   **Feed.jsx** exports `FeedPage` as default; imported as `Feed`. Either rename component to `Feed` or keep `FeedPage` and document. Minor.
-   **Upload.jsx** exports `UploadPageWithProtection` as default; imported as `Upload`. Fine.

---

## 5. API Layer

### 5.1 Structure

-   **`src/api/`** — Clear split: `supabaseClient.js` plus domain modules (`auth.js`, `audio.js`, `posts.js`, `subscriptions.js`, `videos.js`, etc.). Base44 SDK and related files have been removed; subscriptions use `subscriptions.js` (Supabase Edge Functions + tables). Good.

### 5.2 Bugs & Typos

-   **`src/api/audio.js`** — Function name typo: `getUniquDecades` → should be `getUniqueDecades`. Currently **never used** (FilterControls use hardcoded `DECADES`/`TAGS`).
-   **`getUniqueTags`** in `audio.js` is also unused; filters use hardcoded tag lists.

**Actions:**

-   Rename `getUniquDecades` → `getUniqueDecades` for correctness.
-   Decide: either use `getUniqueDecades` / `getUniqueTags` from API in FilterControls (and remove hardcoded lists), or keep static lists and document that filter options are fixed; remove or deprecate the API helpers if unused.

### 5.3 Error Handling Pattern

-   API functions consistently return `{ data, error }` and use try/catch. Good.
-   Some `console.error` in catch blocks; consider a small logging helper or leave as-is for now.

### 5.4 Naming Conventions

-   DB/API use **snake_case** (`free_breaks_ids`, `subscription_status`); React state uses **camelCase** (`freeBreakIds`). Document this at API boundary or add a thin mapping layer if you want full camelCase in the app.

---

## 5A. Function / build of the code (logic, data flow, correctness)

This section focuses on **how the app actually behaves**—not style or formatting: correctness, state, data flow, and failure modes.

### 5A.1 Bugs (logic / API usage)

-   **ManageSubscription → cancelSubscription** — **Fixed.** `subscriptions.js` defines `cancelSubscription(userId)` and updates the `subscriptions` table with `.eq("user_id", userId)`. ManageSubscription was calling `cancelSubscription()` with **no argument**, so `userId` was `undefined` and the update matched no row. Cancellation did nothing. Fix: pass `user.id` from ManageSubscription (e.g. `cancelSubscription(user.id)`).
-   **getUniquDecades** — Typo in `audio.js`; function is never used. Either rename to `getUniqueDecades` and use from FilterControls or remove/deprecate.

### 5A.2 State and context

-   **Auth context value not memoized** — In `AuthProvider`, the `value` object `{ user, loading, signInWithGoogle, signOut, updateProfile }` is recreated on every render. So `updateProfile` (and the whole context) is a new reference every time. Any component that puts `updateUserProfile` (or `updateProfile`) in a `useEffect` dependency array will re-run that effect on every render. **Library.jsx** has `useEffect(..., [user, authLoading, updateUserProfile, navigate])`. That can cause the “fetch breaks” effect to run repeatedly and refetch on every render, which is wasteful and can cause flicker or race conditions. **Action:** Memoize the auth context value (e.g. `useMemo` on `value` and/or stable refs for `signInWithGoogle`, `signOut`, `updateProfile`) so that only `user` and `loading` changes trigger consumers.
-   **ProtectedAdminRoute loading** — Uses `user === undefined` for loading; AuthProvider initializes `user` as `null`, so that branch never runs. Use auth’s `loading` from `useAuth()` instead.

### 5A.3 Subscription flow and two sources of truth

-   **Profile vs subscriptions table** — Subscription status is stored in two places: (1) `profiles.subscription_status` (and `profiles.free_breaks_ids`, etc.) and (2) `subscriptions` table (Stripe-related rows). After “cancel subscription,” ManageSubscription calls both `cancelSubscription(user.id)` (updates `subscriptions` row) and `updateProfile({ subscription_status: "free", stripe_subscription_id: null })` (updates profile). That’s correct for keeping UI in sync, but the app doesn’t refetch the full user after cancel—it only updates local state via `updateProfile`. If the Edge Function or webhook also updates the profile, you’re good; if not, ensure the profile is the source of truth for UI or refetch user after cancel.
-   **Cancel: direct DB vs Edge Function** — `subscriptions.js` has both `cancelSubscription(userId)` (direct Supabase update) and `invokeCancelSubscription()` (Edge Function). ManageSubscription uses the direct update. If Stripe webhooks or Edge Functions are supposed to drive cancellation (e.g. for Stripe sync), consider calling `invokeCancelSubscription()` instead and having the Edge Function update both Stripe and the DB/profile.

### 5A.4 Data fetching and errors

-   **No shared data layer** — Each page fetches its own data in `useEffect` (Library, Feed, etc.). There’s no shared cache, so the same data can be refetched when navigating back. Not wrong, but for growth you could introduce a simple cache or data-fetch hooks (e.g. per-entity) to avoid duplicate requests.
-   **Error handling** — API errors are often surfaced only via `console.error` + `alert(...)`. Users see a generic “Please try again” message. Consider a small toast or inline error state so users get clearer feedback and you can log/send errors in one place.
-   **Loading vs empty vs error** — Some pages don’t clearly separate “loading,” “empty list,” and “request failed.” Tightening these states (and not rendering list UI until loading is done) avoids flashing wrong content.

### 5A.5 Effect dependencies and races

-   **Library.jsx** — `fetchBreaks` runs when `user`, `authLoading`, `updateUserProfile`, or `navigate` changes. Because `updateUserProfile` is not stable (see 5A.2), this can re-run every render. Fix context memoization first; then this effect will only run when user/auth actually change.
-   **Navigate in effects** — Several pages call `navigate(...)` inside `useEffect` (e.g. redirect if not logged in). That’s fine, but if the same effect also sets state, ensure you don’t update state after unmount or after navigation; optional cleanup or a guard can help.

### 5A.6 Summary of functional fixes

| Issue                                      | Severity | Action                                                                         |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| cancelSubscription(userId) not passed      | High     | **Done:** pass `user.id` in ManageSubscription.                                |
| Auth context value not memoized            | Medium   | Memoize `value` in AuthProvider; stabilize updateProfile/signOut/signIn.       |
| ProtectedAdminRoute loading wrong          | High     | Use `loading` from useAuth(), not `user === undefined`.                        |
| Subscription flow / single source of truth | Low      | Document or unify profile vs subscriptions; consider Edge Function for cancel. |
| getUniquDecades typo / unused              | Low      | Rename or remove.                                                              |

---

## 6. Constants & Duplication

### 6.1 Decade & Tag Lists

Same or similar lists appear in:

-   **FilterControls.jsx** — `DECADES`, `TAGS`
-   **Upload.jsx** — `DECADES`, `AVAILABLE_TAGS`
-   **BulkUploadForm.jsx** — `DECADES`
-   **VideoUploadForm.jsx** — `AVAILABLE_TAGS`
-   **CreatePostForm.jsx** — `VIDEO_TAGS`

**Actions:**

-   Add **`src/constants/audio.js`** (or `filters.js`) with shared `AUDIO_DECADES`, `AUDIO_TAGS` and use them in FilterControls, Upload, BulkUploadForm.
-   Add **`src/constants/video.js`** (or similar) for video/post tags and use in VideoUploadForm and CreatePostForm.
-   Reduces drift and single source of truth for filter/upload options.

### 6.2 Magic Strings

-   Subscription statuses: `"free"`, `"subscriber"`, `"unauthenticated"` — used in many places.
-   Role: `"admin"` — used in Layout, ProtectedAdminRoute, Feed, etc.
-   Table/entity names in API: `"audio_breaks"`, `"profiles"`, `"posts"`, etc.

**Actions:**

-   Introduce **`src/constants/subscription.js`** (and optionally `roles.js`) with e.g. `SUBSCRIPTION_STATUS`, `ROLES`, and use these constants everywhere instead of raw strings.

---

## 7. Security & Environment

### 7.1 Asset URLs (done)

-   **`src/config/assets.js`** — Asset URLs now come from env: `VITE_PUBLIC_STORAGE_BASE`, `VITE_ARCHIVE_BANNER_URL`, `VITE_CUSTOM_FONT_URL`. Layout, Home, Subscribe, AudioGridItem, FolderItem use this config. No hardcoded Base44 or storage URLs in components.

### 7.2 Environment Example

-   **`.env.local.example`** documents Supabase, Stripe, and the asset env vars. Set these in `.env.local` for local/dev; configure in Vercel for production.

---

## 8. Layout & Assets

### 8.1 Inline Styles & Fonts

-   **Layout.jsx** builds a large inline `<style>` string in `generateFontCSS()` (Work Sans, custom font face, utility classes). Works but:
    -   Hard to maintain and test.
    -   Mixes global font config with layout component.

**Actions:**

-   Move font definitions (e.g. `@font-face`, Work Sans import) into **`index.css`** or a dedicated **`fonts.css`**, and use Tailwind/utility classes in Layout.
-   If font URL must stay dynamic, keep a minimal inline style for the single `@font-face` that uses an env/config URL; move the rest to global CSS.

### 8.2 Asset URLs

-   **Done.** `src/config/assets.js` provides `getStorageUrl(path)`, `getArchiveBannerUrl()`, `getCustomFontUrl()` from env; components use these instead of hardcoded URLs.

---

## 9. UI & Components

### 9.1 Button Usage

-   **Library.jsx**, **Feed.jsx**, **ProtectedAdminRoute.jsx** use raw `<button>` in several places. Rest of app uses `@/components/ui/button`.
-   For consistency and theming, use the shared **Button** component everywhere unless there’s a good reason not to.

### 9.2 Loading & Error States

-   Loading states are ad hoc (e.g. “loading...”, “loading feed...”, “loading archive...”).
-   No global **error boundary**; errors only in catch blocks and console.

**Actions (optional):**

-   Add a simple **ErrorBoundary** around the app (or around main content) and a fallback UI.
-   Optionally standardize loading UI (e.g. a small `<LoadingSpinner />` or skeleton) for consistency.

### 9.3 Accessibility

-   No audit performed. Worth a pass: focus management, aria labels on icon-only buttons (e.g. nav, dropdown trigger), and form labels.

---

## 10. Testing & Documentation

-   **Tests:** No test files found. No Jest/Vitest config.
-   **README:** No README in repo.

**Actions:**

-   Add a **README.md** with: project name, one-line description, how to run (`npm install`, `npm run dev`), env vars (point to `.env.local.example`), and main scripts.
-   (Phase 4) Add **Vitest** (or Jest) and **React Testing Library**, then add a few smoke tests (e.g. App renders, one critical page or flow) and run tests in CI.

---

## 11. Phased Remediation Plan

### Phase 1 — Quick wins (1–2 days)

**Goal:** Naming, config, and obvious cleanup with minimal behavior change.

1. **Naming**
    - Set `package.json` `name` to `"gp-archive"`.
2. **Formatting**
    - Add Prettier; add `format` / `format:check` scripts; run format once on entire repo.
3. **Dead code**
    - Remove empty `App.css` and its import from `App.jsx`.
    - Remove commented block in `index.css`.
4. **Bugs**
    - Rename `getUniquDecades` → `getUniqueDecades` in `src/api/audio.js` (or remove if unused).
    - **Done:** ManageSubscription now passes `user.id` to `cancelSubscription(user.id)`.
5. **Env**
    - Asset URLs are now in `src/config/assets.js` from env; set `VITE_PUBLIC_STORAGE_BASE`, `VITE_ARCHIVE_BANNER_URL`, `VITE_CUSTOM_FONT_URL` in `.env.local` (see `.env.local.example`).
6. **Unused imports**
    - Remove unused `React` and lucide icons in `Layout.jsx` (and any other files you notice).
7. **Auth loading bug**
    - In ProtectedAdminRoute, use auth context’s `loading` (from `useAuth()`) to show loading state instead of `user === undefined`, so protected routes don’t flash “Access Denied” before auth has resolved.

**Exit criteria:** Same behavior; consistent name; formatted code; asset URLs from env; cleaner CSS; correct protected-route loading state; subscription cancel works (user.id passed).

---

### Phase 2 — Structure & consistency (2–4 days)

**Goal:** Single source of truth for routes, constants, and navigation.

1. **Route config**
    - Define a single route list (path + component + label) and use it for both `<Route>` and Layout nav; derive “current page” with `useLocation`/path matching instead of `_getCurrentPage`.
2. **Constants**
    - Add `src/constants/audio.js` (decades, tags) and use in FilterControls, Upload, BulkUploadForm.
    - Add `src/constants/video.js` (or feed) for video/post tags; use in VideoUploadForm, CreatePostForm.
    - Add `src/constants/subscription.js` (and optionally roles) and replace magic strings.
3. **Navigation**
    - In Layout, replace `window.location.href` with `<Link to={...}>` or `navigate(...)` for in-app pages; keep full reload only for logout if desired, and for external URLs (e.g. Stripe).
4. **Buttons**
    - Replace raw `<button>` with `Button` in Library, Feed, ProtectedAdminRoute where it makes sense.

**Exit criteria:** No duplicated route logic; shared constants; SPA navigation in app; consistent use of Button.

---

### Phase 3 — Maintainability (2–3 days)

**Goal:** Easier to change assets and global styles.

1. **Fonts**
    - Move font setup from Layout’s `generateFontCSS()` into `index.css` or `fonts.css`; use env/config only for the dynamic font URL if needed.
2. **Assets**
    - **Done.** `src/config/assets.js` provides asset URLs from env; Layout, Home, Subscribe, AudioGridItem, FolderItem use it.
3. **Optional**
    - Add a simple ErrorBoundary and standard loading component; use in key places.

**Exit criteria:** No large inline font CSS in Layout; asset URLs centralized; optional resilience/UX improvements.

---

### Phase 4 — Hardening (optional, 2–5 days)

**Goal:** Tests, docs, and optional TypeScript.

1. **README**
    - Add README with description, setup, env, and scripts.
2. **Testing**
    - Add Vitest + React Testing Library; add a few smoke tests (e.g. App, Home or Library); run in CI.
3. **TypeScript**
    - Either convert `utils/index.ts` → `utils/index.js` for full JS, or add `tsconfig.json` and start migrating new or critical files to TS.
4. **ESLint**
    - If you add TS: add `@typescript-eslint/*` and TypeScript parser; extend config for TS/TSX.

**Exit criteria:** README in place; tests run in CI; either all-JS or a clear path to TS.

---

## 12. Summary Table

| Area                                              | Severity      | Effort | Phase |
| ------------------------------------------------- | ------------- | ------ | ----- |
| Package name                                      | Low           | S      | 1     |
| Prettier + format                                 | Medium        | S      | 1     |
| Remove dead CSS / comments                        | Low           | S      | 1     |
| `getUniquDecades` typo                            | Medium        | S      | 1     |
| Asset URLs from env (config/assets.js)            | **Done**      | —      | —     |
| cancelSubscription(user.id) in ManageSubscription | **Done**      | —      | —     |
| Unused imports                                    | Low           | S      | 1     |
| ProtectedAdminRoute loading (use auth.loading)    | High (UX bug) | S      | 1     |
| Auth context value memoization (useEffect deps)   | Medium        | S      | 2     |
| Route config + nav derivation                     | Medium        | M      | 2     |
| Shared constants (decades, tags, subscription)    | Medium        | M      | 2     |
| SPA navigation in Layout                          | Medium        | S      | 2     |
| Button consistency                                | Low           | S      | 2     |
| Fonts in global CSS                               | Low           | M      | 3     |
| Asset URL config                                  | **Done**      | —      | —     |
| Error boundary / loading                          | Low           | S      | 3     |
| README                                            | Medium        | S      | 4     |
| Tests                                             | Medium        | L      | 4     |
| TypeScript path                                   | Low           | L      | 4     |

_S = small, M = medium, L = large._

---

Use this document as a checklist: execute Phase 1 first, then Phase 2, and so on. Adjust phases if you need to ship features in between; the order is chosen to minimize risk and refactor size while improving structure and security.
