# Website_builder
This is a no-code website builder for a single company, with a landing page, admin sign-in, and inline editing. It runs 100% free using open-source tools and free hosting.

## ✨ Features
- Landing page with sections (Hero, Features, Templates, Pricing, Contact, Footer)
- /admin route with sign-in form
- Admins can toggle Edit Mode to update text & images
- Content stored in free database (or JSON for small scale)
- Fully responsive with TailwindCSS
- Free hosting & domain included

## 🛠️ Tech Stack (Free)
Frontend:
- React + Vite → app framework
- Tailwind CSS → styling
- React Router → navigation (/, /admin)
- React Hook Form → form handling

## Backend:
- Node.js + Express → REST API
- SQLite (local file) → simplest option for storing content
- Or use Supabase (Postgres, free tier) if you need cloud storage
- JWT (jsonwebtoken) → authentication
- bcrypt → password hashing

## Hosting & Domain (Free):
- Frontend: GitHub Pages / Vercel / Netlify (all free, with subdomains)
- Backend: Render free tier (or Railway)
- Database: SQLite file in repo (free) or Supabase free tier
- File uploads (images): Cloudinary free plan (2 GB)
- Domain:
  - Free subdomain → yourcompany.github.io, yourcompany.vercel.app
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
