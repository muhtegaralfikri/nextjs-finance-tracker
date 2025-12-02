import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyDueRecurrences } from "@/lib/recurring";

export const runtime = "nodejs";

async function handler(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueUsers = await prisma.recurringTransaction.findMany({
    where: { nextRun: { lte: now } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let created = 0;
  for (const { userId } of dueUsers) {
    const result = await applyDueRecurrences(userId);
    created += result.created;
  }

  return NextResponse.json({
    processedUsers: dueUsers.length,
    created,
  });
}

export const POST = handler;
export const GET = handler;
