# Roadmap Optimasi Client

Rencana bertahap agar UI tetap ringan. Tiap fase bisa dieksekusi mandiri.

## Phase 1 — Cepat Menangkap Beban Besar
- ✅ Ganti enum Prisma di client (`TransactionsClient`, `WalletsClient`) dengan union string/const enum di util shared (`src/lib/financeTypes.ts`) supaya bundle mengecil.
- ✅ Pecah `TransactionsClient` menjadi komponen kecil (Form, Filter, Recurring, Table) dan memo bagian statis agar rerender tidak meluas.
- ✅ Virtualisasi/paginasi daftar transaksi saat data besar; target DOM tetap kecil.
- ✅ Reuse formatter (`Intl.NumberFormat`/`Intl.DateTimeFormat`) via helper (`src/lib/currency.ts`, `src/lib/date.ts`); opsional simpan `displayDate`/`displayAmount` saat normalisasi.

Deliverable: transaksi tetap berfungsi, bundle client turun, rerender jauh berkurang untuk daftar besar.

## Phase 2 — Responsif & Hemat Request
- State loading granular + `useTransition` untuk aksi berat (fetch, delete, export) agar input tidak lag.
- Debounce filter sebelum hit `/api/transactions`; kurangi request ganda.
- Caching client (SWR/React Query) untuk transaksi+recurring; refetch otomatis saat mutate.
- Paginasi/virtualisasi yang lebih baik: server-side pagination (limit/offset atau cursor).

Deliverable: interaksi filter cepat, request berkurang, UI tidak freeze saat aksi berjalan.

## Phase 3 — Payload & Perhitungan
- Optimalkan respons API: kirim data siap tampil (label wallet/kategori, `displayAmount`, `displayDate`) untuk mengurangi pekerjaan render.
- Precompute ringkasan di server (total income/expense/net) daripada dihitung ulang di client setiap render.
- Minimalkan data untuk analitik/grafik (agregasi, bukan raw transaksi).
- Gunakan compression & caching header pada endpoint berat (export/summary) jika belum.

Deliverable: payload API lebih ramping, render loop minim perhitungan, load time turun.

## Phase 4 — UX Berat Beban
- Export non-blocking: streaming atau job + polling; hindari Blob besar di main thread.
- Prefetch ringan saat navigasi (Next.js prefetch) hanya untuk data kecil.
- Pengukuran: tambahkan metrics sederhana (CLS/FID/LCP) atau log waktu fetch/render untuk memandu iterasi.

Deliverable: UX tetap halus untuk operasi berat, ada metrik untuk memvalidasi peningkatan.
