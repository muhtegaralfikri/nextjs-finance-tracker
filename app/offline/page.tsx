"use client";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 text-slate-400 mb-4">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-1.414-7.072m0 0L5.636 5.636m0 0L3 3"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Kamu Sedang Offline</h1>
          <p className="text-slate-400 mb-6">
            Sepertinya koneksi internetmu terputus. Periksa koneksi dan coba lagi.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold transition"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
