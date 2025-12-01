import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, getMonthRange } from "@/lib/finance";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const fromParam = searchParams.get("from") || undefined;
  const toParam = searchParams.get("to") || undefined;

  const { from, to } = fromParam || toParam ? getCustomRange(fromParam, toParam) : getMonthRange();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      walletId,
      categoryId,
      date: { gte: from, lte: to },
    },
    include: { wallet: true, category: true },
    orderBy: { date: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transactions");
  sheet.columns = [
    { header: "Tanggal", key: "date", width: 15 },
    { header: "Wallet", key: "wallet", width: 20 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Tipe", key: "type", width: 10 },
    { header: "Jumlah", key: "amount", width: 15 },
    { header: "Catatan", key: "note", width: 30 },
  ];

  transactions.forEach((tx) => {
    sheet.addRow({
      date: tx.date.toISOString().slice(0, 10),
      wallet: tx.wallet.name,
      category: tx.category.name,
      type: tx.type,
      amount: decimalToNumber(tx.amount),
      note: tx.note || "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions.xlsx"`,
    },
  });
}

function getCustomRange(fromParam?: string, toParam?: string) {
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  return {
    from: from || getMonthRange().from,
    to: to || getMonthRange().to,
  };
}
