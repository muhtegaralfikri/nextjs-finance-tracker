import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyDueRecurrences } from "@/lib/recurring";

export const runtime = "nodejs";

async function handler(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  const tokenParam = url.searchParams.get("secret") || url.searchParams.get("token");
  const isVercelCron = request.headers.has("x-vercel-cron") || request.headers.has("x-vercel-id");

  if (expected) {
    const validHeader = authHeader === `Bearer ${expected}`;
    const validQuery = tokenParam === expected;
    const valid = validHeader || validQuery || isVercelCron;
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
