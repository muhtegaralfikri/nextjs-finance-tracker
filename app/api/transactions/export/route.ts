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

  const totalIncome = transactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((acc, tx) => acc + decimalToNumber(tx.amount), 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((acc, tx) => acc + decimalToNumber(tx.amount), 0);
  const net = totalIncome - totalExpense;
  const periodLabel = `${from.toISOString().slice(0, 10)} s/d ${to.toISOString().slice(0, 10)}`;
  const walletName = walletId ? transactions.find((tx) => tx.walletId === walletId)?.wallet.name : null;
  const categoryName = categoryId ? transactions.find((tx) => tx.categoryId === categoryId)?.category.name : null;
  const walletLabel = walletId ? `Wallet: ${walletName || walletId}` : "Wallet: Semua";
  const categoryLabel = categoryId ? `Kategori: ${categoryName || categoryId}` : "Kategori: Semua";

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transactions");

  // Title
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Laporan Transaksi";
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Metadata
  const metaRow = sheet.addRow([periodLabel, walletLabel, categoryLabel]);
  metaRow.font = { italic: true, color: { argb: "FF6B7280" } };
  sheet.mergeCells(metaRow.number, 2, metaRow.number, 3);

  sheet.addRow([]);

  // Summary
  const summaryRows = sheet.addRows([
    ["Total Pemasukan", totalIncome],
    ["Total Pengeluaran", totalExpense],
    ["Saldo Bersih", net],
  ]);
  summaryRows.forEach((row) => {
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = "#,##0";
    row.getCell(2).alignment = { horizontal: "right" };
  });
  sheet.getCell(`B${summaryRows[summaryRows.length - 1].number}`).font = { bold: true };
  sheet.addRow([]);

  // Table (with filter + banded rows)
  const tableStartRow = sheet.lastRow ? sheet.lastRow.number + 1 : 1;
  const tableColumns = [
    { header: "Tanggal", key: "date", width: 15 },
    { header: "Wallet", key: "wallet", width: 20 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Tipe", key: "type", width: 10 },
    { header: "Jumlah", key: "amount", width: 15 },
    { header: "Catatan", key: "note", width: 30 },
  ];

  sheet.columns = tableColumns;

  const tableRows = transactions.map((tx) => [
    tx.date,
    tx.wallet.name,
    tx.category.name,
    tx.type,
    decimalToNumber(tx.amount),
    tx.note || "",
  ]);

  sheet.addTable({
    name: "TransactionsTable",
    ref: `A${tableStartRow}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: tableColumns.map((col) => ({ name: col.header, filterButton: true })),
    rows: tableRows,
  });

  // Number/date formats
  sheet.getColumn("A").numFmt = "dd/mm/yyyy";
  sheet.getColumn("E").numFmt = "#,##0";

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: tableStartRow }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions.xlsx"`,
      "Cache-Control": "private, max-age=300",
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
