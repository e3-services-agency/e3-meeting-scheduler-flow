# E3 Connect – Meeting Scheduler

A lightweight booking/meeting scheduler for E3, built with Vite + React + TypeScript and shadcn‑ui, deployed on Vercel and backed by Supabase (Auth + DB).

---

## Live

* **Production:** [https://connect.e3-services.com](https://connect.e3-services.com)

---

## Tech Stack

* **Vite** (React + TypeScript)
* **shadcn‑ui** + **Tailwind CSS**
* **React Router** (client‑side routing)
* **@tanstack/react‑query** (server state)
* **Supabase** (Auth + database)
* **Vercel** (hosting)

---

## Quick Start (Local Dev)

Requirements: Node.js 18+ and npm. We recommend installing Node via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```bash
# 1) Clone the repo
git clone https://github.com/e3-services-agency/e3-meeting-scheduler-flow.git
cd e3-meeting-scheduler-flow

# 2) Install deps
npm install

# 3) Configure environment
cp .env.example .env
# Then set the variables (see below)

# 4) Start dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with:

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> In Vercel, set these under **Project → Settings → Environment Variables** for both **Production** and **Preview**.

### NPM Scripts

```bash
npm run dev       # start local dev server
npm run build     # production build to /dist
npm run preview   # preview the production build locally
npm run lint      # lint sources
```

---

## Deployment (Vercel)

Deploys are automatic on pushes to `main`.

### SPA Routing (Required)

Because this is a React SPA with React Router, Vercel must always serve `index.html` for deep links (e.g. `/book/:clientSlug`, `/admin-settings`). The project includes a `vercel.json` file in the repo root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

If you add or restore this file, trigger a redeploy and **Clear/Ignore build cache** to ensure the rewrite is applied.

### Custom Domain

* Add your domain in **Vercel → Project → Settings → Domains** and follow the DNS prompts (Cloudflare/registrar).
* Vercel will auto‑provision SSL (Let’s Encrypt). It may take several minutes after a DNS change.

### Environment Variables on Vercel

Configure under **Project → Settings → Environment Variables**:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`

Apply to **Production** and **Preview**.

---

## Supabase Auth Setup

1. In **Supabase Dashboard → Authentication → URL Configuration** set:

   * **Site URL:** `https://connect.e3-services.com`
   * **Additional Redirect URLs:**

     * `https://connect.e3-services.com/*`
     * *(optional for previews)* `https://*.vercel.app/*`
2. If using OAuth providers, ensure their console/apps allow the above domain(s) and use the Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback`.

---

## Routing & 404 Page

The app defines a catch‑all route to render a custom 404 page:

```tsx
// in main.tsx (excerpt)
<Route path="*" element={<NotFound />} />
```

Make visual updates in `src/pages/NotFound.tsx`.

---

## Troubleshooting

**Deep links 404 in Incognito**

* Ensure `vercel.json` exists in the repo root (same level as `package.json`) and matches the snippet above.
* Redeploy with **Clear/Ignore build cache**.
* In the deployment’s details, check the **Routes/Rewrites** section shows `/(.*) → /`.

**Auth redirects fail**

* Verify Supabase **Site URL** and **Additional Redirect URLs** include your production domain.
* For protected routes (e.g., `/admin-settings`), Incognito will redirect to `/auth` until you sign in.

**Build looks stale**

* In Vercel → Deployment → **Redeploy** with **Clear/Ignore build cache**.
* Confirm you’re building the latest commit SHA from GitHub.

---

## Project Structure (high level)

```
├─ public/                # static assets
├─ src/
│  ├─ pages/              # route pages (Landing, Auth, ClientBooking, AdminSettings, NotFound)
│  ├─ components/         # shared UI/components
│  ├─ index.css           # Tailwind entry
│  └─ main.tsx            # app entry + routes
├─ vercel.json            # SPA rewrites
├─ package.json
└─ vite.config.ts
```

---

## Contributing

* Create a feature branch, open a PR, and ensure a green Vercel preview build.

## License

Private © E3. All rights reserved.
