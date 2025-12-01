import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:py-16">
        <div className="absolute right-4 top-4 sm:static sm:flex sm:justify-end">
          <ThemeToggle className="h-10 w-10 sm:h-auto sm:w-auto" />
        </div>
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-[0.2em]">
              Personal Finance Tracker
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold leading-tight">
              Satu tempat untuk catat dompet, transaksi, dan ringkasan keuanganmu.
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              Dibangun dengan Next.js App Router + Prisma + Auth.js. Kelola banyak wallet,
              kategori, dan lihat performa bulanan tanpa ribet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-3 shadow-lg shadow-emerald-500/30 w-full sm:w-auto transition active:translate-y-px active:opacity-90"
            >
              Mulai Gratis
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-slate-100 transition w-full sm:w-auto hover:bg-(--skeleton-bg) hover:border-(--skeleton-bg) hover:text-white active:translate-y-px active:opacity-90"
            >
              Login
            </a>
          </div>
        </header>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Multiple Wallet"
            desc="Cash, bank, e-wallet, atau investasi. Pantau saldo dan jenisnya."
          />
          <FeatureCard
            title="Transaksi + Filter"
            desc="Catat income/expense, filter per tanggal, wallet, atau kategori."
          />
          <FeatureCard
            title="Ringkasan Bulanan"
            desc="Total saldo, income vs expense, dan breakdown kategori."
          />
        </section>

        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold mb-2">Siap lanjut ke dashboard?</h2>
          <p className="text-slate-300 mb-4">
            Login untuk mengakses dashboard, wallets, dan transaksi. Kamu bisa menambah data
            kapan saja, semuanya disimpan per user.
          </p>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 transition active:translate-y-px active:opacity-90"
            >
              Buka Dashboard
            </a>
            <a
              href="/transactions"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 transition-colors hover:bg-(--skeleton-bg) hover:border-(--skeleton-bg) hover:text-white active:translate-y-px active:opacity-90"
            >
              Lihat Transaksi
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-emerald-900/30">
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-300">{desc}</p>
    </div>
  );
}
