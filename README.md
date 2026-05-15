# 🪴 MindNest — Private Journal Web App

> A warm, personal journaling app where your thoughts stay private, secure, and always yours.

**Live Demo:** [mindnest-d9jn.onrender.com](https://mindnest-d9jn.onrender.com)

---

## ✨ Features

- **Mood-aware quotes** — Pick your mood (Calm, Motivated, Reflective, Hopeful, Low) and get a matching quote to inspire your writing
- **Private journaling** — Every entry is scoped to the authenticated user. No one else can read, edit, or delete your entries
- **Full CRUD** — Create, read, edit, and delete journal entries
- **Mood tagging** — Tag each entry with your mood; see it displayed on every journal card
- **Writing prompts** — A random prompt on your welcome screen to help you start writing
- **Keyword search** — Search across all your entries by title or content instantly
- **Word count** — See word count on every entry card and view page
- **Day streak** — Tracks consecutive days you've journaled (like Duolingo)
- **Google OAuth** — One-click sign in with Google alongside local auth
- **Responsive design** — Works on desktop, tablet, and mobile
- **IST timestamps** — All dates and times shown in Indian Standard Time

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Auth | Passport.js (Local Strategy + Google OAuth 2.0) |
| Database | PostgreSQL (via `pg` Pool — no ORM) |
| Templating | EJS |
| Styling | Custom CSS (design system with CSS variables) |
| Fonts | Google Fonts — Lora + Inter |
| Icons | Tabler Icons |
| Hosting | Render (Node app) + Neon (PostgreSQL) |
| Security | bcrypt password hashing, session-based auth, per-user query scoping |

---

## 🗄 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  email     VARCHAR(255) UNIQUE NOT NULL,
  password  VARCHAR(255),
  name      VARCHAR(255)
);

-- Entries table
CREATE TABLE entries (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  mood       VARCHAR(50) DEFAULT 'calm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Security Highlights

- Passwords hashed with **bcrypt** (10 salt rounds)
- Sessions managed with **express-session**
- All entry routes scoped with `WHERE user_id = $1` — users can never access each other's data
- Environment variables for all secrets — never hardcoded
- Google OAuth 2.0 with secure callback URL

---

## 📁 Project Structure

```
mindnest/
├── config/
│   └── passport.js        # Local + Google OAuth strategies
├── routes/
│   ├── auth.js            # Login, register, logout, Google OAuth
│   └── entries.js         # All journal CRUD + search + API endpoints
├── views/
│   ├── home.ejs           # Landing page
│   ├── welcome.ejs        # Logged-in dashboard (mood + quote)
│   ├── dashboard.ejs      # Journal page (all entries)
│   ├── new-entry.ejs      # Create entry form
│   ├── view-entry.ejs     # Read single entry
│   ├── edit-entry.ejs     # Edit entry form
│   ├── login.ejs          # Login page
│   └── register.ejs       # Register page
├── public/
│   ├── css/styles.css     # Full design system
│   └── favicon.svg        # Custom SVG favicon
├── db.js                  # PostgreSQL Pool connection
├── app.js                 # Express app + middleware
└── package.json
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js v18+, PostgreSQL

```bash
# Clone the repo
git clone https://github.com/goyal-nandini/mindnest.git
cd mindnest

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Create tables in PostgreSQL
psql -U your_user -d mindnest -f schema.sql

# Start development server
npm run dev
```

**Environment variables needed:**

```env
SESSION_SECRET=
DATABASE_URL=
NODE_ENV=development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 🌐 Deployment

- **App hosting:** [Render](https://render.com) — free tier web service
- **Database:** [Neon](https://neon.tech) — free serverless PostgreSQL (no expiry)
- **CI/CD:** Auto-deploys on every push to `main` branch

---

## 💡 Engineering Decisions

**Why Pool over Client?**
`pg.Pool` handles multiple concurrent connections and auto-reconnects on failure. `pg.Client` opens one connection — if it drops, the app crashes. Pool is the production-correct choice.

**Why no ORM?**
Writing raw SQL builds a deeper understanding of database operations and gives full control over query optimization. For a project this size, an ORM adds unnecessary abstraction.

**Why hardcoded quotes over an API?**
Zero latency, zero failure points, works offline. An external quotes API adds a network call on every page load — for a journal app where reliability matters, local quotes are the right tradeoff.

**Why serialize only user ID in session?**
Serializing the full user object means stale data if the user updates their profile. Serializing just the ID and fetching fresh on each request ensures data is always current.

---

## 🙋 Author

**Nandini Goyal**
- GitHub: [@goyal-nandini](https://github.com/goyal-nandini)
- Live project: [mindnest-d9jn.onrender.com](https://mindnest-d9jn.onrender.com)

---

*Built from scratch as a full-stack resume project — every line of code written and understood.*
