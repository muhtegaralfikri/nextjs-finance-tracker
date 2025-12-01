import bcrypt from "bcryptjs";
import {
  PrismaClient,
  WalletType,
  CategoryType,
  TransactionType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@finance.local" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@finance.local",
      passwordHash,
    },
  });

  const cash = await prisma.wallet.upsert({
    where: { id: `${user.id}-cash` },
    update: {},
    create: {
      id: `${user.id}-cash`,
      name: "Dompet Cash",
      type: WalletType.CASH,
      currency: "IDR",
      initialBalance: 250_000,
      currentBalance: 250_000,
      userId: user.id,
    },
  });

  const bank = await prisma.wallet.upsert({
    where: { id: `${user.id}-bank` },
    update: {},
    create: {
      id: `${user.id}-bank`,
      name: "Bank Utama",
      type: WalletType.BANK,
      currency: "IDR",
      initialBalance: 5_000_000,
      currentBalance: 5_000_000,
      userId: user.id,
    },
  });

  const incomeCat = await prisma.category.upsert({
    where: { id: `${user.id}-salary` },
    update: {},
    create: {
      id: `${user.id}-salary`,
      name: "Gaji",
      type: CategoryType.INCOME,
      userId: user.id,
    },
  });

  const foodCat = await prisma.category.upsert({
    where: { id: `${user.id}-food` },
    update: {},
    create: {
      id: `${user.id}-food`,
      name: "Makan",
      type: CategoryType.EXPENSE,
      userId: user.id,
    },
  });

  const transportCat = await prisma.category.upsert({
    where: { id: `${user.id}-transport` },
    update: {},
    create: {
      id: `${user.id}-transport`,
      name: "Transport",
      type: CategoryType.EXPENSE,
      userId: user.id,
    },
  });

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        walletId: bank.id,
        categoryId: incomeCat.id,
        type: TransactionType.INCOME,
        amount: 7_500_000,
        date: today,
        note: "Gaji bulanan",
      },
      {
        userId: user.id,
        walletId: cash.id,
        categoryId: foodCat.id,
        type: TransactionType.EXPENSE,
        amount: 50_000,
        date: today,
        note: "Sarapan",
      },
      {
        userId: user.id,
        walletId: cash.id,
        categoryId: transportCat.id,
        type: TransactionType.EXPENSE,
        amount: 30_000,
        date: today,
        note: "KRL",
      },
    ],
  });

  await prisma.wallet.update({
    where: { id: cash.id },
    data: { currentBalance: { increment: -80_000 } },
  });
  await prisma.wallet.update({
    where: { id: bank.id },
    data: { currentBalance: { increment: 7_500_000 } },
  });

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId: user.id,
        categoryId: foodCat.id,
        month: thisMonth,
      },
    },
    update: { amount: 1_500_000 },
    create: {
      userId: user.id,
      categoryId: foodCat.id,
      month: thisMonth,
      amount: 1_500_000,
    },
  });

  await prisma.goal.upsert({
    where: { id: `${user.id}-goal` },
    update: {},
    create: {
      id: `${user.id}-goal`,
      userId: user.id,
      name: "Dana Darurat",
      targetAmount: 10_000_000,
      currentAmount: 2_500_000,
      deadline: new Date(today.getFullYear(), today.getMonth() + 4, 1),
      note: "Target 4 bulan",
    },
  });

  console.log("Seed selesai. Login dengan demo@finance.local / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
