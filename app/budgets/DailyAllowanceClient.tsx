"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/alert";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "./BudgetsClient";

type DailyExpense = {
  date: string;
  spent: number;
};

type AllowanceDay = DailyExpense & {
  planned: number;
  status: "ok" | "over" | "upcoming";
};

type AllowancePlan = {
  days: AllowanceDay[];
  totalBudget: number;
  spendableBudget: number;
  baseDaily: number;
  nextCap: number;
  remainingBudget: number;
  spentSoFar: number;
  reservedGoal: number;
  dailySaving: number;
  reservedRemaining: number;
  reservedProgress: number;
  completedSaving: number;
};

export default function DailyAllowanceClient({
  initialMonth,
  categories,
  initialDays,
}: {
  initialMonth: string;
  categories: BudgetCategory[];
  initialDays: DailyExpense[];
}) {
  const [hydrated, setHydrated] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [categoryId, setCategoryId] = useState<string>("");
  const [totalBudget, setTotalBudget] = useState<string>("");
  const [dailyTarget, setDailyTarget] = useState<string>("");
  const [goalReserve, setGoalReserve] = useState<string>("");
  const [days, setDays] = useState<DailyExpense[]>(initialDays);
  const [goalDeposits, setGoalDeposits] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    // Ambil ulang data jika bulan awal berbeda (misal redirect ke bulan lain dari server).
    if (initialDays.length === 0) {
      handleFetch();
    }
    try {
      const saved = localStorage.getItem("daily-allowance-settings");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          month?: string;
          categoryId?: string;
          totalBudget?: string;
          dailyTarget?: string;
          goalReserve?: string;
          deposits?: string[];
        };
        if (parsed.month) setMonth(parsed.month);
        if (parsed.categoryId) setCategoryId(parsed.categoryId);
        if (parsed.totalBudget) setTotalBudget(parsed.totalBudget);
        if (parsed.dailyTarget) setDailyTarget(parsed.dailyTarget);
        if (parsed.goalReserve) setGoalReserve(parsed.goalReserve);
        if (parsed.deposits?.length) setGoalDeposits(new Set(parsed.deposits));
      }
    } catch (error) {
      console.error("Failed to load allowance prefs", error);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = {
      month,
      categoryId,
      totalBudget,
      dailyTarget,
      goalReserve,
      deposits: Array.from(goalDeposits),
    };
    try {
      localStorage.setItem("daily-allowance-settings", JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to save allowance prefs", error);
    }
  }, [hydrated, month, categoryId, totalBudget, dailyTarget, goalReserve, goalDeposits]);

  function toggleGoalDeposit(date: string) {
    setGoalDeposits((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  const plan = useMemo(
    () =>
      buildAllowancePlan(
        days,
        Number(totalBudget) || 0,
        Number(dailyTarget) || 0,
        Number(goalReserve) || 0,
        goalDeposits.size,
        todayKey
      ),
    [dailyTarget, days, goalReserve, goalDeposits, todayKey, totalBudget]
  );

  async function handleFetch() {
    setLoading(true);
    setStatus(null);
    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (categoryId) params.set("categoryId", categoryId);

      const res = await fetch(`/api/allowance?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus({
          type: "error",
          message: data?.error || "Gagal memuat pengeluaran harian",
        });
        return;
      }

      const data = await res.json();
      setDays(Array.isArray(data?.days) ? data.days : []);
      if (data?.month) {
        setMonth(data.month);
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Tidak bisa terhubung ke server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-950/60">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>Kalender Uang Harian</CardTitle>
            <CardDescription>
              Bagi dana bulan ini per hari. Kalau ada hari yang over, limit hari berikutnya otomatis menyesuaikan.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleFetch} loading={loading}>
            Muat Ulang Data
          </Button>
        </div>
        {status && (
          <Alert variant={status.type === "success" ? "success" : "error"} className="mt-2">
            {status.message}
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Bulan">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>

          <Field label="Kategori">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Semua pengeluaran</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Dana bulan ini">
            <Input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="Contoh: 600000"
            />
          </Field>

          <Field label="Target per hari">
            <Input
              type="number"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              placeholder="Contoh: 20000"
            />
          </Field>
          <Field label="Cadangan goal bulan ini">
            <Input
              type="number"
              value={goalReserve}
              onChange={(e) => setGoalReserve(e.target.value)}
              placeholder="Contoh: 400000 untuk parfum"
            />
          </Field>
        </div>
        <p className="text-xs text-slate-400">
          Formula: (dana bulan ini - cadangan goal) ÷ sisa hari. Contoh 600k, tabung 400k untuk parfum,
          sisa 200k dibagi 30 hari → limit belanja ~6.6k/hari. Jika satu hari terpakai 40k, limit hari berikutnya turun otomatis.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatChip label="Dana untuk bulan ini" value={formatCurrency(plan.totalBudget)} />
          <StatChip label="Cadangan goal bulan ini" value={formatCurrency(plan.reservedGoal)} />
          <StatChip label="Target dasar / hari" value={formatCurrency(plan.baseDaily)} />
          <StatChip label="Limit hari berikutnya" value={formatCurrency(plan.nextCap)} />
          <StatChip
            label="Sisa dana terpantau"
            value={formatCurrency(plan.remainingBudget)}
            muted={plan.remainingBudget <= 0}
          />
          <StatChip
            label="Butuh nabung per hari"
            value={formatCurrency(plan.dailySaving)}
            muted={plan.reservedGoal === 0}
          />
        </div>

        <div className="text-sm text-slate-400">
          Total terpakai bulan ini (kategori terpilih):{" "}
          <span className="text-white font-semibold">{formatCurrency(plan.spentSoFar)}</span>
          {plan.reservedGoal > 0 && (
            <>
              {" • "}
              <span className="text-slate-300">
                Setoran goal tercatat: {formatCurrency(plan.completedSaving)} /{" "}
                {formatCurrency(plan.reservedGoal)} ({plan.reservedProgress}%)
              </span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {plan.days.map((day) => (
            <div
              key={day.date}
              className={`rounded-xl border px-3 py-2 transition-colors ${
                day.status === "ok"
                  ? "border-emerald-600/70 bg-emerald-500/10 text-emerald-100"
                : day.status === "over"
                  ? "border-rose-400 bg-rose-100 text-rose-800"
                  : "border-[#cbd5e1] bg-[#e2e8f0] text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  {Number(day.date.split("-")[2])}
                </span>
                <span
                  className={
                    day.status === "ok"
                      ? "text-emerald-200"
                      : day.status === "over"
                      ? "text-rose-700"
                      : "text-slate-600"
                  }
                >
                  {day.status === "ok" ? "On track" : day.status === "over" ? "Over" : "..." }
                </span>
              </div>
              <p
                className={`mt-1 text-xs font-semibold ${
                  day.status === "over" ? "text-rose-800" : ""
                }`}
              >
                Limit: {formatCurrency(day.planned)}
              </p>
              <p
                className={`text-xs font-semibold ${
                  day.status === "over" ? "text-rose-800" : ""
                }`}
              >
                Terpakai: {formatCurrency(day.spent)}
              </p>
              {plan.dailySaving > 0 && day.date <= todayKey && (
                <button
                  type="button"
                  onClick={() => toggleGoalDeposit(day.date)}
                  className={`mt-2 w-full rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                    goalDeposits.has(day.date)
                      ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                      : day.status === "over"
                      ? "border-rose-300 bg-white/80 text-rose-800 hover:bg-rose-50"
                      : day.status === "ok"
                      ? "border-emerald-300 bg-white/80 text-emerald-800 hover:bg-emerald-50"
                      : "border-slate-300 bg-white/80 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {goalDeposits.has(day.date) ? "Sudah setor goal" : "Setor goal hari ini"}
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildAllowancePlan(
  days: DailyExpense[],
  totalBudgetInput: number,
  dailyTargetInput: number,
  goalReserveInput: number,
  goalDepositCount: number,
  todayKey: string
): AllowancePlan {
  if (days.length === 0) {
    return {
      days: [],
      totalBudget: 0,
      spendableBudget: 0,
      baseDaily: 0,
      nextCap: 0,
      remainingBudget: 0,
      spentSoFar: 0,
      reservedGoal: 0,
      dailySaving: 0,
      reservedRemaining: 0,
      reservedProgress: 0,
      completedSaving: 0,
    };
  }

  const reservedGoal = Math.max(goalReserveInput, 0);
  const spendableBudgetRaw = totalBudgetInput > 0 ? totalBudgetInput - reservedGoal : 0;
  const spendableBudget = Math.max(spendableBudgetRaw, 0);

  const resolvedBudget =
    spendableBudget > 0 ? spendableBudget : Math.max(dailyTargetInput, 0) * days.length;
  const baseDaily =
    dailyTargetInput > 0
      ? dailyTargetInput
      : days.length > 0
      ? Math.round(resolvedBudget / days.length)
      : 0;

  let remainingForPlanning = resolvedBudget;
  const plannedDays: AllowanceDay[] = days.map((day, index) => {
    const daysLeft = days.length - index;
    const planned =
      daysLeft > 0 ? Math.max(0, Math.round(remainingForPlanning / daysLeft)) : 0;
    const spent = Math.max(day.spent, 0);
    remainingForPlanning -= spent;

    const status =
      day.date > todayKey ? "upcoming" : spent <= planned ? "ok" : "over";

    return { ...day, planned, status };
  });

  const spentSoFar = plannedDays
    .filter((day) => day.date <= todayKey)
    .reduce((acc, day) => acc + day.spent, 0);

  const nextDay = plannedDays.find((day) => day.date >= todayKey);
  const lastPlanned = plannedDays.length > 0 ? plannedDays[plannedDays.length - 1].planned : 0;
  const nextCap = nextDay?.planned ?? (lastPlanned || baseDaily);
  const remainingBudget = Math.max(0, resolvedBudget - spentSoFar);
  const dailySaving =
    reservedGoal > 0 && days.length > 0 ? Math.ceil(reservedGoal / days.length) : 0;
  const completedSaving = Math.min(reservedGoal, goalDepositCount * dailySaving);
  const reservedRemaining = Math.max(0, reservedGoal - completedSaving);
  const reservedProgress =
    reservedGoal === 0 ? 0 : Math.round((completedSaving / reservedGoal) * 100);

  return {
    days: plannedDays,
    totalBudget: totalBudgetInput,
    spendableBudget,
    baseDaily,
    nextCap,
    remainingBudget,
    spentSoFar,
    reservedGoal,
    dailySaving,
    reservedRemaining,
    reservedProgress,
    completedSaving,
  };
}

function StatChip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${muted ? "text-slate-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}
