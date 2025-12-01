# Personal Finance Tracker

Next.js App Router + Prisma + Auth.js finance tracker untuk wallets, transaksi, budgets, goals — dengan UI responsif dan optimasi performa client/server.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- Auth.js / NextAuth v5 (credentials)
- Prisma ORM v7 + PostgreSQL
- Tailwind CSS v4 + Lucide React

## Fitur
- Auth protected pages (login/register, redirect jika belum login).
- Wallets, transaksi dengan filter, budgets per kategori, dan savings goals.
- Skeleton loading dinamis (mode terang/gelap otomatis), toggle tema di header.
- Quick actions Profile & Settings di sidebar + bottom nav mobile; halaman `/profile` & `/settings` tersedia.
- Format Rupiah tanpa spasi antara simbol dan nominal.
- Transaksi berulang dengan auto-posting, ekspor transaksi ke Excel, dan seed demo siap pakai.
- Tabel transaksi dengan paginasi server, caching ringan, dan ekspor streaming.
- Semua tombol punya efek hover/press yang terasa di mobile; halaman landing/login/register ditata ulang dengan Manrope.

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
AUTH_SECRET="your-random-secret"
```

## Jalankan
1) `npm install`  
2) `npx prisma generate` (dan `npx prisma migrate dev` jika perlu)  
3) `npm run dev` lalu buka `http://localhost:3000`  
4) (Opsional) `npm run db:seed` untuk membuat user demo `demo@finance.local / Password123!` dan data contoh.  

## Catatan Tema
- Default render SSR/CSR: terang. Variabel CSS di `app/globals.css` mengatur warna, skeleton pakai `--skeleton-bg` (light: #e2e8f0, dark: #1f2937).

## Konvensi
- Protected route: `const session = await auth(); if (!session?.user) redirect("/login");`
- UI berbasis komponen di `src/components/ui/` (button, input, card, select, alert, spinner, skeleton).
- Tipe shared: gunakan `src/lib/financeTypes.ts` (hindari impor enum Prisma di client).
- Formatter: gunakan `src/lib/currency.ts` dan `src/lib/date.ts` untuk pemformatan konsisten.
