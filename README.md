# Personal Finance Tracker

Personal finance tracker untuk mengelola banyak wallet, transaksi, budget, savings goal, dan limit harian yang menyesuaikan otomatis.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- Auth.js / NextAuth v5 (credentials)
- Prisma ORM v7 + PostgreSQL
- Tailwind CSS v4 + Lucide React

## Fitur
- Auth protected (login/register, redirect jika belum login).
- Wallets multi-currency, transaksi dengan filter/paginasi, budgets per kategori, savings goals.
- Daily allowance: limit harian menyesuaikan overspending; goal cadangan per bulan.
- Transaksi berulang dengan auto-posting (cron endpoint tersedia) dan ekspor Excel.
- Skeleton/loading ramah mobile, toggle tema, bottom nav di mobile, sidebar di desktop.
- Format Rupiah rapi, landing/login/register lebih polished.

## Struktur Singkat
```
app/
  dashboard/ page.tsx
  wallets/ page.tsx
  transactions/ page.tsx
  budgets/ page.tsx
  profile/ page.tsx
  settings/ page.tsx
  api/... (auth, wallets, transactions, budgets, goals, dll)
src/
  components/ (AppShell, UI primitives, ThemeToggle/Provider)
  lib/ (prisma, finance helpers, summaries, categories, budgets, goals)
prisma/ (schema + migrations)
```

## Environment
Buat `.env` dengan:
```
DATABASE_URL="postgres://user:pass@host:5432/dbname"
AUTH_SECRET="your-random-secret"   # atau NEXTAUTH_SECRET
NEXTAUTH_URL="http://localhost:3000"  # ganti dengan domain prod
CRON_SECRET="your-cron-token"      # untuk /api/cron/process-recurring
```

## Jalankan
1) `npm install`  
2) `npx prisma generate` (dan `npx prisma migrate dev` jika perlu)  
3) `npm run dev` lalu buka `http://localhost:3000`  
4) (Opsional) `npm run db:seed` untuk membuat user demo `demo@finance.local / Password123!` dan data contoh.  

## Cron Recurring
- Endpoint: `POST/GET /api/cron/process-recurring` dengan header `Authorization: Bearer $CRON_SECRET`.
- Jika memakai Vercel cron, jadwal ada di `vercel.json` (harian). Set `CRON_SECRET` di env Vercel dan redeploy.
- Tes manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/process-recurring`.

## Konvensi
- Protected route: `const session = await auth(); if (!session?.user) redirect("/login");`
- UI berbasis komponen di `src/components/ui/` (button, input, card, select, alert, spinner, skeleton).
- Tipe shared: gunakan `src/lib/financeTypes.ts` (hindari impor enum Prisma di client).
- Formatter: gunakan `src/lib/currency.ts` dan `src/lib/date.ts` untuk pemformatan konsisten.
