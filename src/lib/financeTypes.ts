export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const CategoryType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const RecurringCadence = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;
export type RecurringCadence = (typeof RecurringCadence)[keyof typeof RecurringCadence];

export const WalletType = {
  CASH: "CASH",
  BANK: "BANK",
  E_WALLET: "E_WALLET",
  INVESTMENT: "INVESTMENT",
  OTHER: "OTHER",
} as const;
export type WalletType = (typeof WalletType)[keyof typeof WalletType];
