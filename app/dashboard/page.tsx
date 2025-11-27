// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  // Kalau belum login → ke /login
  if (!session?.user) {
    redirect("/login");
  }

  const nameOrEmail = session.user.name || session.user.email || "User";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">
          Dashboard Keuangan
        </h1>
        <p className="text-slate-300">
          Halo, <span className="font-semibold">{nameOrEmail}</span>
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Di sini nanti kita tampilkan ringkasan saldo, pengeluaran per kategori,
          dan grafik. Sekarang ini dulu sebagai pondasi.
        </p>
      </div>
    </main>
  );
}
