# Blade & Snow Services Website

Modern marketing website with an admin dashboard to manage content (hero, services, portfolio, testimonials, and contact details). Fully responsive, fast, and deployable on free tiers.

## ✨ Key Features
- **Landing Page Sections**: `Hero`, `Services`, `Work (Portfolio)`, `Process`, `Testimonials`, `Contact`, `Footer`.
- **Quote Form**: Sends styled HTML email to your inbox with Gmail-compatible template.
- **Admin Dashboard (/admin)**: Secure login, edit content per section, live preview sync via cache events.
- **Seasonal Mode**: Summer/Winter toggles hero, services, and portfolio data.
- **Footer All Services**: Merged list from both Summer and Winter services.
- **Dynamic Contact**: Header phone and Contact/Let’s Connect data come from the DB (phone, email, address, hours, weekend note, Facebook).
- **Smooth Scroll**: Header “Get Quote”, Hero CTA, and Footer “Emergency Service” scroll to the quote form.

## 🛠️ Tech Stack
- Frontend: React + Vite, TailwindCSS, Framer Motion, lucide-react, Radix UI
- Backend: Node.js + Express, SQLite (local file), multer for uploads
- Auth: JWT + bcrypt
- Email: Nodemailer (Gmail App Password)

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
