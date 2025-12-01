import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
