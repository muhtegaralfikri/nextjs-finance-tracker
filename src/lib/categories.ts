import { CategoryType } from "@prisma/client";
import { prisma } from "./prisma";

const defaultCategories: Array<{ name: string; type: CategoryType }> = [
  { name: "Gaji", type: CategoryType.INCOME },
  { name: "Bonus", type: CategoryType.INCOME },
  { name: "Investasi", type: CategoryType.INCOME },
  { name: "Lainnya", type: CategoryType.INCOME },
  { name: "Makan", type: CategoryType.EXPENSE },
  { name: "Transport", type: CategoryType.EXPENSE },
  { name: "Hiburan", type: CategoryType.EXPENSE },
  { name: "Kebutuhan Rumah", type: CategoryType.EXPENSE },
  { name: "Kesehatan", type: CategoryType.EXPENSE },
];

export async function ensureDefaultCategories(userId: string) {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    // Session id tidak valid terhadap database yang baru → biarkan caller menangani
    return;
  }

  const existingCount = await prisma.category.count({ where: { userId } });
  if (existingCount > 0) return;

  await prisma.category.createMany({
    data: defaultCategories.map((cat) => ({
      name: cat.name,
      type: cat.type,
      isDefault: true,
      userId,
    })),
  });
}
