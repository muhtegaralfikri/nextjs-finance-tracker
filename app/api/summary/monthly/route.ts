import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlySummary } from "@/lib/summary";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") || undefined;

  try {
    const summary = await getMonthlySummary(session.user.id, monthParam || undefined);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil ringkasan bulanan" },
      { status: 400 }
    );
  }
}
