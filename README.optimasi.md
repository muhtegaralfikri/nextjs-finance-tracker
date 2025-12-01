# Roadmap Optimasi Client

Rencana bertahap agar UI tetap ringan. Tiap fase bisa dieksekusi mandiri.

## Phase 1 — Cepat Menangkap Beban Besar
- ✅ Ganti enum Prisma di client (`TransactionsClient`, `WalletsClient`) dengan union string/const enum di util shared (`src/lib/financeTypes.ts`) supaya bundle mengecil.
- ✅ Pecah `TransactionsClient` menjadi komponen kecil (Form, Filter, Recurring, Table) dan memo bagian statis agar rerender tidak meluas.
- ✅ Virtualisasi/paginasi daftar transaksi saat data besar; target DOM tetap kecil.
- ✅ Reuse formatter (`Intl.NumberFormat`/`Intl.DateTimeFormat`) via helper (`src/lib/currency.ts`, `src/lib/date.ts`); opsional simpan `displayDate`/`displayAmount` saat normalisasi.

Deliverable: transaksi tetap berfungsi, bundle client turun, rerender jauh berkurang untuk daftar besar.

## Phase 2 — Responsif & Hemat Request
- ✅ State loading granular (fetch/save/delete/export per-aksi; `useTransition` opsional) agar input tidak lag.
- ✅ Debounce filter sebelum hit `/api/transactions` (auto-fetch 350ms setelah perubahan).
- ✅ Caching client sederhana + dedupe fetch transaksi via cache map (key by filter+page) dan recurring (TTL 60s).
- ✅ Paginasi server (`page`/`limit` di API + query take/skip) menggantikan slicing client.

Deliverable: interaksi filter cepat, request berkurang, UI tidak freeze saat aksi berjalan.

## Phase 3 — Payload & Perhitungan
- ✅ Optimalkan respons API: transaksi hanya kirim field yang diperlukan + label wallet/kategori siap tampil.
- ✅ Precompute ringkasan di server (total income/expense/net) di respons transaksi.
- ✅ Minimalkan data untuk analitik/grafik: ringkasan bulanan di-cache 5 menit; transaksi agregasi dari server.
- ✅ Tambah header cache untuk endpoint berat (export Excel, summary bulanan).

Deliverable: payload API lebih ramping, render loop minim perhitungan, load time turun.

## Phase 4 — UX Berat Beban
- ✅ Pengukuran: tambah helper metrics (`measureAsync`, `reportMetric`) + logging durasi fetch transaksi/recurring/export.
- ✅ Export lebih ramah: klik download dijalankan via `requestIdleCallback`, log ukuran/latensi ekspor.
- ✅ Prefetch ringan saat navigasi (`/transactions` diprefetch via header CTA).
- ✅ Export non-blocking: endpoint export disajikan via streaming response (chunked) untuk beban besar.

Deliverable: UX tetap halus untuk operasi berat, ada metrik dasar untuk memvalidasi peningkatan.
