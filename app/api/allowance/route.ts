import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDailyExpensesByDate } from "@/lib/allowance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const walletId = searchParams.get("walletId") || undefined;

  try {
    const data = await getDailyExpensesByDate(session.user.id, {
      month,
      categoryId,
      walletId,
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengeluaran harian" },
      { status: 400 }
    );
  }
}
