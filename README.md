# Blade & Snow Services Website Builder

Modern marketing site + admin dashboard. Built for real-world constraints: zero-redeploy content updates, resilient API, clean local dev (no credits), and cloud-ready.

## ✨ Highlights
- **Admin Dashboard**: Manage Hero, Services, Portfolio, Testimonials, and Contact. Seasonal mode (summer/winter) for content.
- **Zero‑redeploy runtime config**: Frontend reads `/api/config`, sourced from Supabase `settings` or a JSON file in Supabase Storage. Update `SITE_NAME`/`USER_EMAIL` at runtime.
- **Settings Editor**: Master admins can edit `SITE_NAME` and `USER_EMAIL` in-dashboard; served to the frontend via `/api/config`.
- **Uploads → Supabase Storage**: Images processed in memory with `sharp`, converted to WebP, and uploaded. No local file persistence.
- **DB Adapters**: Content and Users adapters support Supabase (Postgres) or SQLite via a single flag (`USE_SUPABASE_DB`).
- **Resilient Frontend**: Axios retry with backoff for 429/503. Runtime-configurable API base.
- **Security by design**: No secrets in the frontend. CORS allowlist. Helmet. Rate limits. Passwords hashed with bcrypt.

## 🧱 Architecture
- **Frontend (Netlify)**: React + Vite + Tailwind. Uses a small runtime config loader (`frontend/src/services/runtimeConfig.ts`) that fetches `/api/config`.
- **Backend (Render)**: Express API (`backend/server.js`), with adapters for Supabase or SQLite. Public runtime config at `/api/config` only exposes non-sensitive values.
- **Database (Supabase)**: `users`, `content`, `password_reset_tokens`, `email_change_requests`, `settings`. Migration script provided.
- **Storage (Supabase)**: Public bucket for uploaded images.

```
Frontend (Netlify)  ──calls──>  Netlify /api proxy  ──>  Backend (Render)  ──>  Supabase (DB+Storage)
```

## 🛠️ Tech Stack
- Frontend: React (Vite), TailwindCSS, Framer Motion, Radix UI, lucide-react
- Backend: Node.js, Express, Multer (memory), Sharp, JWT + bcrypt
- Cloud: Netlify (frontend), Render (backend), Supabase (DB + Storage)
- Email: Nodemailer (Gmail App Password)

## 📂 Project Structure (top-level)
```
Website_builder/
├── frontend/                      # React app (Vite)
│   ├── public/config.json         # Local defaults; overridden by /api/config
│   ├── netlify.toml               # /api proxy to backend for dev/prod
│   └── src/
│       ├── components/admin/      # Admin dashboard (Settings editor included)
│       └── services/              # api.ts, runtimeConfig.ts, settings.ts
└── backend/                       # Express API
    ├── server.js                  # Main app, routes, CORS, rate limits
    ├── dbAdapter.js               # Content adapter (Supabase/SQLite)
    ├── usersAdapter.js            # Users + tokens adapter (Supabase/SQLite)
    ├── settingsAdapter.js         # Settings adapter (Supabase + SQLite fallback)
    ├── supabase_schema.sql        # Schema for Supabase
    └── migrate-sqlite-to-supabase.js
```

## 🔧 Environment Variables (Backend)
Required (Render service):
```
JWT_SECRET=your_jwt_secret
USE_SUPABASE_DB=true
SUPABASE_URL=...           # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...  # Service role key
SUPABASE_BUCKET=uploads

# CORS allowlist (comma-separated)
FRONTEND_ORIGINS=https://<your-netlify-site>.netlify.app,http://localhost:8888

# Email (Gmail)
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
```
Optional runtime-config source via Storage JSON:
```
SUPABASE_CONFIG_BUCKET=my-config
SUPABASE_CONFIG_KEY=config/runtime.json
```

## 🚀 Local Development (No credits)
- **Start Netlify dev** (proxies `/api` to Render; avoids CORS):
```
cd frontend
npm install
npm run dev:netlify  # http://localhost:8888
```
- **API base in dev**: `frontend/public/config.json` has `"API_BASE_URL": "/api"`. The Netlify proxy (see `frontend/netlify.toml`) forwards `/api/*` to the Render backend.

## ☁️ Deployment
- **Frontend (Netlify)**
  - Publish dir: `frontend/dist`
  - `netlify.toml` includes:
    - Proxy: `/api/*` → `https://<render-service>/api/:splat`
    - SPA fallback to `/index.html`
- **Backend (Render)**
  - Start command: `node server.js`
  - Set env variables as above
- **Database (Supabase)**
  - Run `backend/supabase_schema.sql` in SQL editor
  - Migrate existing SQLite data: `node backend/migrate-sqlite-to-supabase.js`

## 🔐 Security & Reliability
- **No secrets in frontend**; `/api/config` returns only public-safe values.
- **Auth**: JWT + bcrypt. Password reset & email change tokens in DB.
- **Rate limits**: Global and per-route, tuned to reduce 429s. Frontend retries 429/503 with exponential backoff and honors `Retry-After`.
- **Uploads**: In-memory only, verified mime types, `sharp` optimization, uploaded to Supabase Storage (no local disk).

### Security Hardening (Supabase RLS)
- Enable Row Level Security (RLS) on app tables to block anon access (backend uses a service role key and bypasses RLS):
  ```sql
  alter table public.users enable row level security;
  alter table public.content enable row level security;
  alter table public.password_reset_tokens enable row level security;
  alter table public.email_change_requests enable row level security;
  alter table public.settings enable row level security;
  ```
- With RLS enabled and no policies, PostgREST denies anon/authed reads/writes by default. The backend continues to work using `SUPABASE_SERVICE_ROLE_KEY`.
- Optional: in the Supabase UI, uncheck “Expose in API” for these tables if you never intend direct PostgREST access.

## 🧭 Admin Dashboard
- Route: `/admin`
- Tabs: Hero, Services, Portfolio, Reviews, Contact, Settings
- Changes persist via `contentApi.createOrUpdate` and sync to the site immediately (in the same browser) via localStorage cache events.
- **Settings Editor**: Edit `SITE_NAME` and `USER_EMAIL` (stored in Supabase `settings`). Frontend picks up via `/api/config` on next load.

## 🧪 Quick Tests
```
# Health
curl -sS https://<render>/api/health

# Config
curl -sS https://<render>/api/config

# Auth
curl -sS -X POST https://<render>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## ✉️ Test Quote Email
Use the homepage “Get Your Free Quote” form or run a curl:
```
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.sender@example.com",
    "phone": "555-000-0000",
    "service": "Free Consultation",
    "message": "Testing email template"
  }'
```
If the email fails, verify EMAIL_USER and EMAIL_PASS are correct and that the backend restarted after editing `.env`.

## 📜 License
MIT License © 2025
  - Or free domain → from Freenom (.tk, .ml, .ga, .cf, .gq)

