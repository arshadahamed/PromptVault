# PromptVault

A beautiful, production-ready AI Prompt Gallery — browse, search, and discover 2,000+ free prompts for ChatGPT, Midjourney, Gemini, DALL-E, Flux, and more.

[![Live Site](https://img.shields.io/badge/Live%20Site-egrow.lk-7c3aed?style=for-the-badge&logo=vercel)](https://egrow.lk)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-f6821f?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

---

## Features

### Public Gallery

- **2,000+ AI Prompts** with real generated images stored on Cloudflare R2
- **10 Model Categories** — ChatGPT, Midjourney, Gemini, Stable Diffusion, DALL-E, Flux, Seedance, Nanobanana, Adobe Firefly, Leonardo AI
- **Sort & Filter** — Featured, Newest, Popular with instant tab switching
- **Live Search** — debounced full-text search with keyboard-friendly modal
- **Favorites** — save prompts locally, details loaded on demand
- **History** — automatically tracks recently viewed prompts
- **Prompt Detail Pages** — full prompt view with related suggestions
- **ISR Caching** — gallery rebuilds every 60 seconds, always up-to-date

### Admin Panel

- **Full Prompt CRUD** — create, edit, delete, bulk delete
- **Image Upload** — drag-and-drop to Cloudflare R2 with instant public URL
- **Category Management** — add, rename, delete categories
- **Import / Export** — JSON bulk import and full data export
- **Site Settings** — branding, SEO meta, footer, social links, announcement bar
- **Promo Card** — configurable popup card with live preview
- **Password Management** — change admin password from the UI (bcrypt hashed, no redeploy needed)
- **Dark / Light / System** theme with instant switching

### Technical Highlights

- **Server Components** — gallery and detail pages are fully server-rendered; zero client JS for content
- **Per-page SEO** — each prompt gets its own `<title>`, `<description>`, and OpenGraph image
- **Secure JWT Auth** — HMAC-SHA256 signed tokens, `httpOnly` cookies, constant-time comparison
- **bcrypt Password Storage** — hashed at cost 12, stored in a dedicated table isolated from the settings API
- **Dual Supabase Clients** — service role for admin routes, anon key for public routes (respects RLS)

---

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| **Framework** | [Next.js](https://nextjs.org) App Router | 16.2.9 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | v4 |
| **Animations** | Framer Motion | 12 |
| **Icons** | Lucide React | latest |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL 17) | — |
| **File Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) via AWS S3 SDK v3 | — |
| **Auth** | Custom JWT (Web Crypto API, HMAC-SHA256) | — |
| **Password Hashing** | bcryptjs | cost 12 |
| **Deployment** | [Vercel](https://vercel.com) | — |

---

## Database Schema

```sql
-- AI Prompts
CREATE TABLE prompts (
  id            TEXT PRIMARY KEY,
  prompt_text   TEXT NOT NULL DEFAULT '',
  model         TEXT NOT NULL DEFAULT 'ChatGPT',
  tab           TEXT NOT NULL DEFAULT 'ChatGPT',
  category      TEXT NOT NULL DEFAULT 'ChatGPT',
  local_img     TEXT DEFAULT '',
  image_url     TEXT DEFAULT '',
  author_name   TEXT DEFAULT 'Admin',
  handle        TEXT DEFAULT '@admin',
  gradient_from TEXT DEFAULT '#d4f5b4',
  gradient_to   TEXT DEFAULT '#f5b4e8',
  aspect_ratio  TEXT DEFAULT '4/3',
  likes         INTEGER DEFAULT 0,
  views         INTEGER DEFAULT 0,
  featured      BOOLEAN DEFAULT FALSE,
  published     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt categories
CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single-row site settings (JSONB)
CREATE TABLE settings (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin credentials — isolated from settings API, never exposed publicly
CREATE TABLE admin_credentials (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash TEXT NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Project Structure

```text
├── app/
│   ├── (gallery)/                    # Public gallery routes
│   │   ├── layout.tsx                # Sidebar + mobile header
│   │   ├── page.tsx                  # Gallery home (ISR revalidate=60)
│   │   ├── GalleryClient.tsx         # Client: tab/sort/filter state
│   │   └── prompt/[id]/page.tsx      # Prompt detail + related + SEO metadata
│   ├── admin/                        # Admin panel (JWT-protected)
│   │   ├── page.tsx                  # Dashboard
│   │   ├── prompts/                  # Prompt list, new, edit pages
│   │   ├── categories/               # Category management
│   │   ├── import-export/            # Bulk JSON import/export
│   │   └── settings/                 # Site settings + password change
│   ├── api/
│   │   ├── auth/login|logout/        # JWT cookie auth
│   │   ├── admin/                    # Protected CRUD endpoints
│   │   │   ├── prompts/              # GET/POST/PUT/DELETE + bulk delete
│   │   │   ├── categories/           # GET/POST/PUT/DELETE
│   │   │   ├── settings/             # GET/PUT
│   │   │   ├── upload/               # POST → Cloudflare R2
│   │   │   ├── import/               # POST → bulk insert
│   │   │   ├── export/               # GET → JSON download
│   │   │   └── change-password/      # POST → bcrypt → admin_credentials
│   │   ├── search/                   # Public search (anon key, limit 10)
│   │   ├── prompts/batch/            # Public batch fetch by IDs
│   │   └── promo/                    # Public promo card settings
│   ├── login/                        # Login page
│   ├── icon.tsx                      # Dynamic favicon (proxies R2 upload or PV branded)
│   └── layout.tsx                    # Root layout with full SEO metadata
├── lib/
│   ├── auth.ts                       # JWT sign/verify, checkCredentials (bcrypt-aware)
│   ├── admin-auth.ts                 # requireAdmin middleware
│   ├── db.ts                         # Supabase CRUD, fromRow/toRow mappers, pagination
│   ├── settings.ts                   # getSettings / saveSettings
│   ├── supabase.ts                   # Service role + anon clients
│   ├── r2.ts                         # Cloudflare R2 S3 client
│   └── types.ts                      # Shared TypeScript types
├── components/
│   ├── gallery/                      # GalleryGrid, PromptCard
│   ├── prompt/                       # PromptDetail
│   ├── sidebar/                      # Sidebar, MobileHeader
│   ├── layout/                       # TabBar, BottomDock, FifaPromoCard
│   └── modals/                       # SearchModal, HistoryModal, FavoritesModal
├── context/
│   ├── AppContext.tsx                 # Global modal/tab state
│   └── AdminThemeContext.tsx          # Admin dark/light/system theme
└── scripts/
    └── migrate-to-supabase.mjs       # One-time migration: JSON files → Supabase + R2
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with public access enabled

### 1. Clone & install

```bash
git clone https://github.com/arshadahamed/PromptVault.git
cd PromptVault
npm install
```

### 2. Create database tables

Run the SQL from the [Database Schema](#database-schema) section in your Supabase **SQL Editor**.

### 3. Set environment variables

Create `.env.local` in the project root:

```env
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-random-secret-at-least-32-chars

# Supabase — note: sb_secret_ = service role, sb_publishable_ = anon
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_ANON_KEY=sb_publishable_...

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### 4. Run locally

```bash
npm run dev
```

- Gallery → <http://localhost:3000>
- Admin → <http://localhost:3000/admin/login>

---

## Deployment

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new) — framework preset: **Next.js**
3. Add all env vars from `.env.local` in **Project Settings → Environment Variables**
4. Deploy — every push to `master` triggers an automatic redeploy

---

## Security

| Concern | Implementation |
| --- | --- |
| Admin authentication | HMAC-SHA256 JWT, `httpOnly` + `SameSite=Strict` cookie, 7-day TTL |
| Timing attacks | `crypto.timingSafeEqual` on all credential and token comparisons |
| Password storage | bcrypt hash (cost 12) in a dedicated `admin_credentials` table |
| Public vs. admin API | Anon key for public routes, service role key only in admin routes |
| Password changes | Current password verified before any update is written |

---

## Environment Variables Reference

| Variable | Description |
| --- | --- |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD` | Login password — used as fallback until changed via the UI |
| `JWT_SECRET` | Secret for signing auth tokens (min 16 chars) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server/admin routes only, never expose client-side |
| `SUPABASE_ANON_KEY` | Anon key — public read-only routes, respects RLS |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Name of your R2 bucket |
| `R2_PUBLIC_URL` | Public base URL for your R2 bucket (e.g. `https://pub-xxxx.r2.dev`) |

---

## License

MIT © 2026 [ArshaD](https://egrow.lk)
