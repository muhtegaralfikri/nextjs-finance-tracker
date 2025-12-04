import { NextResponse } from "next/server";
import { CategoryType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const category = await prisma.category.findFirst({
    where: { id, userId },
  });

  if (!category) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  // Tidak boleh edit kategori default
  if (category.isDefault) {
    return NextResponse.json(
      { error: "Kategori default tidak dapat diubah" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, type } = body;

    // Jika type diubah, cek apakah ada transaksi yang menggunakan kategori ini
    if (type && type !== category.type) {
      const transactionCount = await prisma.transaction.count({
        where: { categoryId: id, userId },
      });

      if (transactionCount > 0) {
        return NextResponse.json(
          { error: `Tidak dapat mengubah tipe kategori karena sudah digunakan oleh ${transactionCount} transaksi` },
          { status: 400 }
        );
      }

      if (!Object.values(CategoryType).includes(type)) {
        return NextResponse.json(
          { error: "Jenis kategori tidak valid" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? category.name,
        type: type ?? category.type,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

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

  const category = await prisma.category.findFirst({
    where: { id, userId },
  });

  if (!category) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  // Tidak boleh hapus kategori default
  if (category.isDefault) {
    return NextResponse.json(
      { error: "Kategori default tidak dapat dihapus" },
      { status: 400 }
    );
  }

  // Cek apakah kategori masih digunakan oleh transaksi
  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id, userId },
  });

  if (transactionCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${transactionCount} transaksi` },
      { status: 400 }
    );
  }

  // Cek apakah kategori digunakan oleh recurring transaction
  const recurringCount = await prisma.recurringTransaction.count({
    where: { categoryId: id, userId },
  });

  if (recurringCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${recurringCount} transaksi berulang` },
      { status: 400 }
    );
  }

  // Cek apakah kategori digunakan oleh budget
  const budgetCount = await prisma.budget.count({
    where: { categoryId: id, userId },
  });

  if (budgetCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${budgetCount} budget` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
