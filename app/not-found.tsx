import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-8xl font-bold text-emerald-500 mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h1>
          <p className="text-slate-400">
            Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold transition"
          >
            Ke Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-700 text-slate-100 hover:bg-slate-800 transition"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
