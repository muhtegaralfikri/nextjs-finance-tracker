import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.16), transparent 35%), radial-gradient(circle at 80% 10%, rgba(94, 234, 212, 0.14), transparent 30%), linear-gradient(135deg, rgba(15, 23, 42, 0.7), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-emerald-300/80 uppercase tracking-[0.2em]">
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
          <div className="flex gap-3">
            <a
              href="/register"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-3 shadow-lg shadow-emerald-500/30"
            >
              Mulai Gratis
            </a>
            <a
              href="/login"
              className="rounded-xl border border-slate-700 hover:border-emerald-400 px-5 py-3 text-slate-100"
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
              className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2"
            >
              Buka Dashboard
            </a>
            <a
              href="/transactions"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:border-emerald-400"
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
