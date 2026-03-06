# 💰 Flo — Personal Finance Tracker

A full-stack personal budget tracker with AI-powered transaction categorization, real-time analytics, and a sleek dark UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-green?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-white?style=flat-square&logo=prisma)

## ✨ Features

- **Dashboard** — Monthly snapshot of income, expenses, savings rate, and recent transactions
- **Transactions** — Full CRUD with search, filters by month/type, and category badges
- **AI Categorization** — Type a description, hit the ✨ button, and GPT-4o-mini auto-fills the category
- **Budgets** — Set monthly limits per category with visual progress bars and over-budget alerts
- **Analytics** — 6-month trend charts, daily spending lines, and category breakdown pie chart
- **Auth** — Google & GitHub OAuth via NextAuth.js
- **CI/CD** — GitHub Actions on every push

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js |
| AI | OpenAI GPT-4o-mini |
| Deployment | Vercel |

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — from Supabase (Settings → Database → Connection string)
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com)
- `GITHUB_ID` / `GITHUB_SECRET` — from [GitHub OAuth Apps](https://github.com/settings/developers)
- `OPENAI_API_KEY` — optional, enables AI categorization

### 3. Set up the database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment (Vercel)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXTAUTH_URL` to your production URL
5. Deploy — Vercel auto-runs `prisma generate && next build`

## 📁 Project Structure

```
app/
├── api/                  # API routes
│   ├── auth/             # NextAuth
│   ├── transactions/     # CRUD
│   ├── budgets/          # CRUD
│   ├── analytics/        # Aggregated stats
│   └── ai-categorize/    # OpenAI integration
├── (auth)/login/         # Login page
└── (dashboard)/          # Protected pages
    └── dashboard/
        ├── page.tsx      # Overview
        ├── transactions/ # Transactions list
        ├── budgets/      # Budget manager
        └── analytics/    # Charts & insights
components/
├── forms/                # TransactionModal
└── layout/               # Sidebar
lib/
├── auth.ts               # NextAuth config
├── prisma.ts             # DB client
└── utils.ts              # Helpers
prisma/
└── schema.prisma         # DB schema
```

## 🔐 OAuth Setup

**Google:** Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI.

**GitHub:** Go to [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App. Set callback URL to `http://localhost:3000/api/auth/callback/github`.

---

Built with ❤️ as a portfolio project.
