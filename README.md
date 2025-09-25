# Blade & Snow Services Website

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
- **Settings Editor**: Edit `SITE_NAME` and `USER_EMAIL` (stored in Supabase `settings`). Frontend picks up via `/api/config` on next load.
- **Image Previews**: Constrained to 600×600 in dashboard for visual consistency.

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

## Why this project stands out (for recruiters)
- **Production‑minded design**: runtime config, DB/storage separation, adapters, safe defaults.
- **Cloud‑ready**: Netlify + Render + Supabase with zero‑credit local dev.
- **Operational quality**: retries, rate limits, and structured routes to minimize downtime.
- **Security posture**: no secret leaks, bcrypt hashing, and master‑admin protections.


## 📂 Project Structure
```
Website_builder/
├── frontend/                # React app (Vite)
│   ├── src/components/      # UI components
│   ├── src/components/admin # Admin dashboard
│   ├── src/services/api.ts  # API client
│   └── index.html
└── backend/                 # Express API
    ├── server.js            # Express entry
    ├── seedData.js          # Default content
    ├── email.js             # Nodemailer email sender
    └── uploads/             # Uploaded images
```

## 🔧 Environment Variables (backend/.env)
Required for backend:
```
PORT=5000
JWT_SECRET=your_jwt_secret

# Email (Gmail via Nodemailer)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
# Optional: override recipient mailbox
CONTACT_RECIPIENT=your_inbox@example.com
```
Important: Use a Gmail App Password (Google Account → Security → App passwords). Regular Gmail passwords won’t work.

## 🚀 Local Development
Open two terminals.

- Frontend
```
cd frontend
npm install
npm run dev
# Local: http://localhost:5173 (or shown port)
```

- Backend
```
cd backend
npm install
node server.js
# API: http://localhost:5000
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

## 🗂️ Content Model (DB Keys)
- `hero.summer`, `hero.winter`: title, subtitle, ctaText, metrics
- `services.summer`, `services.winter`: list of services with title, description, image, price, features, color
- `portfolio.summer`, `portfolio.winter`: project cards
- `testimonials`: array
- `contact`: phone, email, address, hours, weekendNote, facebook

## 🧭 Admin Dashboard
- Route: `/admin`
- Tabs: Hero, Services, Portfolio, Reviews, Contact, Settings
- Changes persist via `contentApi.createOrUpdate` and sync to the site immediately (in the same browser) via localStorage cache events.
- Added hover/active emphasis on tabs to improve clarity.

## ☁️ Deployment Recommendations
- Frontend (static):
  - Vercel or Netlify: push to GitHub, import repo, set framework to Vite, and deploy. Output dir: `frontend/dist` (use `npm run build` in `frontend/`).
  - Alternative: GitHub Pages (needs a separate build and publish step).
- Backend (server):
  - Render (Free Web Service): connect GitHub repo, set root to `backend/`, Start command: `node server.js`, add `.env` in Render dashboard.
  - Ensure CORS in `backend/server.js` allows your deployed frontend origin.
- Database: SQLite file stored on server disk. For multi-instance or cloud DB, migrate to Postgres (e.g., Supabase) with similar schema.

## 🔒 Security Notes
- Use `JWT_SECRET` and secure it in environment variables.
- Never commit real passwords or app secrets.
- Helmet is configured for dev with relaxed CSP; tighten for production.

## 🧭 Useful Paths
- Frontend: `frontend/src/components/`
- Admin: `frontend/src/components/admin/`
- Backend: `backend/server.js`, `backend/seedData.js`, `backend/email.js`

## 📜 License
MIT License © 2025
  - Or free domain → from Freenom (.tk, .ml, .ga, .cf, .gq)

## 📂 Project Structure
```
project-root/
│
├── frontend/                # React app
│   ├── components/          # Header, Hero, Features, etc.
│   ├── pages/               # Landing, Admin
│   ├── editor/              # Edit mode logic
│   ├── App.jsx              # Main app component
│   └── main.jsx             # React entry point
│
└── backend/                 # Express API
    ├── routes/              # auth.js, content.js
    ├── models/              # sqlite schema
    └── server.js            # Express entry
```

## 🚀 Getting Started
1. Clone the Repository
```
git clone https://github.com/your-username/company-name.git
cd company-name
```

3. Install Dependencies
### Frontend
```
cd frontend
npm install
```

### Backend
```
cd ../backend
npm install
```

3. Run Development Servers
### Frontend (Vite dev server)
```
npm run dev
```

### Backend (Express API)
```
npm run start
```

Frontend → http://localhost:5173

Backend → http://localhost:5000

## 🔑 Admin Login Setup

Create a .env file in /backend with credentials:
```
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=supersecret
JWT_SECRET=your_jwt_secret
```

Start backend, then login at /admin.
If successful → redirected to editor with Edit Mode toggle.

## ✏️ Editing Workflow
- Admin logs in at /admin.
- Click Edit Mode toggle in toolbar.
- Editable areas (text/images) are highlighted.
- Update content → click Save.
- Changes stored in database → reloaded on next visit.

## ☁️ Deployment (Free)
Frontend → GitHub Pages
npm run build
npm run deploy

- URL: https://yourusername.github.io/company-builder
- Backend → Render
- Push code to GitHub
- Create new Web Service in Render
- Set npm start as start command
- Add .env variables in Render dashboard
- Deploy

## ✅ Roadmap / Kanban Issues

- Landing Page UI (Hero, Features, Pricing, Contact)
- /admin sign-in route
- Edit Mode toggle
- Inline text editing
- Image upload & replacement
- Save + load content from database
- Free hosting & deployment

## 📜 License

MIT License © 2025
