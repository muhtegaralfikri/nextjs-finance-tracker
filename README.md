Sip, kita samakan README-nya dengan struktur project kamu yang sekarang (routes di `app/`, helper di `src/`).

Kamu bisa **replace seluruh isi `README.md`** dengan ini:

````md
# Next.js Personal Finance Tracker

A fullstack personal finance tracker built with **Next.js App Router**, **Prisma ORM v7**, and **Auth.js (NextAuth v5)**.

You can:

- Register & log in with email/password
- Manage multiple wallets (cash, bank, e-wallet, investments)
- Record income and expenses by category
- (Planned in Phase 3) View monthly summaries, charts, budgets, and more

> This project is designed as a portfolio app and a playground for modern fullstack patterns.

---

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Auth**: Auth.js / NextAuth v5 (Credentials provider)
- **Database ORM**: Prisma ORM v7 (SQLite in development, ready for PostgreSQL/MySQL)
- **UI**: React with Tailwind CSS (ready for shadcn/ui)
- **Runtime**: Node.js (npm)

---

## Project Structure

Current structure (after Phase 2) looks like this:

```txt
.
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  └─ [...nextauth]/route.ts   # Auth.js handlers
│  │  └─ register/route.ts           # User registration endpoint
│  ├─ dashboard/
│  │  └─ page.tsx                    # Protected dashboard
│  ├─ login/
│  │  └─ page.tsx                    # Login page
│  ├─ register/
│  │  └─ page.tsx                    # Register page
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx                     # Root layout
│  └─ page.tsx                       # Landing / index page
├─ src/
│  ├─ lib/
│  │  └─ prisma.ts                   # PrismaClient helper (singleton)
│  ├─ types/                         # Shared TypeScript types (optional)
│  └─ auth.ts                        # Auth.js / NextAuth configuration
├─ prisma/
│  ├─ schema.prisma                  # Database schema (models, enums)
│  └─ migrations/                    # Prisma Migrate files
├─ prisma.config.ts                  # Prisma v7 config (datasource URL, schema path)
├─ dev.db                            # Local SQLite DB (should NOT be committed)
├─ public/
├─ .env                              # Local environment variables (NOT committed)
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ next.config.ts
└─ README.md
````

> Note: `dev.db` and `.env` should be ignored by Git (listed in `.gitignore`).

---

## Database Schema (Prisma Models)

Prisma schema defines these main entities:

* **User**

  * `id`, `name`, `email`, `passwordHash`
  * Relations: `wallets`, `categories`, `transactions`
* **Wallet**

  * `id`, `userId`, `name`, `type`, `initialBalance`, `currency`
  * Enum: `WalletType` (`CASH`, `BANK`, `E_WALLET`, `INVESTMENT`, `OTHER`)
* **Category**

  * `id`, `userId`, `name`, `type`, `isDefault`
  * Enum: `CategoryType` (`INCOME`, `EXPENSE`)
* **Transaction**

  * `id`, `userId`, `walletId`, `categoryId`, `type`, `amount`, `date`, `note`
  * Enum: `TransactionType` (`INCOME`, `EXPENSE`)

Key ideas:

* Every `Transaction` belongs to a single `User`, `Wallet`, and `Category`.
* Money values (`amount`, `initialBalance`) use `Decimal` for accuracy.
* `createdAt` / `updatedAt` timestamps exist on all models for sorting and auditing.

---

## Authentication Flow

Auth is implemented using **Auth.js (NextAuth v5)** with the **Credentials provider**:

* Users log in with **email + password**
* Passwords are hashed with `bcryptjs`
* Sessions use **JWT** strategy
* `AUTH_SECRET` environment variable is required

Important files:

* `src/auth.ts`

  * Exports `{ handlers, auth, signIn, signOut }` from `NextAuth({...})`
  * Configures Credentials provider and callbacks (`jwt`, `session`)
* `app/api/auth/[...nextauth]/route.ts`

  * Exposes Auth.js route handlers:

    ```ts
    import { handlers } from "@/auth";
    export const { GET, POST } = handlers;
    ```
* `app/api/register/route.ts`

  * `POST /api/register` creates a new `User` with hashed password
* `app/login/page.tsx`

  * Calls `signIn("credentials", { email, password })` from `next-auth/react`
* `app/register/page.tsx`

  * Sends `POST` to `/api/register` with `{ name, email, password }`
* Protected pages (e.g. `app/dashboard/page.tsx`) use:

  ```ts
  import { auth } from "@/auth";
  import { redirect } from "next/navigation";

  const session = await auth();
  if (!session?.user) redirect("/login");
  ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Development DB (SQLite)
DATABASE_URL="file:./dev.db"

# Auth.js / NextAuth v5 secret (required)
AUTH_SECRET="your-random-secret-here"
```

Tips:

* For development, you can generate a secret with:

  ```bash
  npx auth secret
  ```

* For production, set these in your hosting provider’s environment settings and switch `DATABASE_URL` to a real Postgres/MySQL URL.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/muhtegaralfikri/nextjs-finance-tracker.git
cd nextjs-finance-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env` in the project root:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-random-secret-here"
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init_schema
```

This also creates the `dev.db` SQLite file if it doesn’t exist.

### 5. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## NPM Scripts

Common scripts:

* `npm run dev` — start Next.js dev server
* `npm run build` — build for production
* `npm run start` — start production build
* `npx prisma migrate dev` — apply schema changes to DB
* `npx prisma studio` — open Prisma Studio (database browser)

---

## Feature Overview & Roadmap

This project is organized into **phases**.

### ✅ Phase 1 — Project & Database Foundation

* Initialize Next.js App Router project
* Setup TypeScript, ESLint, Tailwind CSS
* Install Prisma v7 and configure `prisma.config.ts`
* Define Prisma models:

  * `User`, `Wallet`, `Category`, `Transaction` + enums
* Run initial migration and verify via `prisma studio`

### ✅ Phase 2 — Authentication & Basic Dashboard

* Configure Auth.js / NextAuth v5 with Credentials provider
* Implement:

  * `/register` page + `POST /api/register`
  * `/login` page integrating `signIn("credentials")`
* Add protected `/dashboard` route:

  * Uses `auth()` from `src/auth.ts` to require login
* Basic dashboard content:

  * Greets the logged-in user
  * Placeholder for future summaries and charts

---

### ✅ Phase 3 — Wallets, Transactions, and Monthly Summary

> **Goal:** Make the app actually useful as a personal finance tracker.

#### 3.1 Wallet Management

**User stories**

* As a user, I can create multiple wallets (Cash, Bank Jago, Bibit, etc.).
* As a user, I can rename or delete a wallet safely.
* As a user, I can see total balance per wallet.

**Implementation sketch**

* **Routes**

  * Page: `app/wallets/page.tsx`
  * API:

    * `GET /api/wallets`
    * `POST /api/wallets`
    * `PATCH /api/wallets/[id]`
    * `DELETE /api/wallets/[id]`

* **Backend**

  * Use `prisma.wallet` with `userId` from session (via `auth()`).
  * On delete:

    * Either prevent deletion if there are transactions, OR
    * Soft-delete (add `deletedAt` field) and exclude from normal queries.
  * “Current balance” per wallet can be computed as:

    * `initialBalance + sum(income) - sum(expense)` for that wallet.

* **Frontend**

  * Page shows list of wallets (name, type, currency, balance).
  * Provide a form or dialog to add/edit wallets.
  * Allow deleting wallets according to backend safety rules.

#### 3.2 Category Setup (Defaults + Custom)

**User stories**

* As a user, I start with default categories (Makan, Transport, etc.) for income & expense.
* As a user, I can add my own categories.

**Implementation sketch**

* Seed default categories per user (e.g. on first dashboard load) if none exist.

* Optional management page:

  * Page: `app/categories/page.tsx`
  * API:

    * `GET /api/categories`
    * `POST /api/categories`

* Categories must be scoped by `userId`.

#### 3.3 Transaction CRUD + Filtering

**User stories**

* As a user, I can record income/expense:

  * Select wallet
  * Select category
  * Enter amount, date, and an optional note
* As a user, I can see a table of transactions with filters:

  * Date range
  * Wallet
  * Category
* As a user, I can edit or delete a transaction if needed.

**Implementation sketch**

* **Routes**

  * Page: `app/transactions/page.tsx`
  * API:

    * `GET /api/transactions?from=&to=&walletId=&categoryId=`
    * `POST /api/transactions`
    * `PATCH /api/transactions/[id]`
    * `DELETE /api/transactions/[id]`

* **Backend**

  * All queries filter by `userId`.
  * Default `from`/`to`: current month if not provided.
  * Use Prisma `Decimal` for the `amount` field.

* **Frontend**

  * Table columns:

    * Date, Wallet, Category, Type, Amount, Note
  * Filters:

    * Date range
    * Wallet dropdown
    * Category dropdown
  * “Add transaction” form:

    * Modal or inline form in the page.

#### 3.4 Monthly Summary & Dashboard Widgets

**User stories**

* As a user, I can see per-month:

  * Total income
  * Total expense
  * Net amount (income − expense)
  * Breakdown of expenses per category

**Implementation sketch**

* **API**

  * `GET /api/summary/monthly?month=YYYY-MM`
  * Response example:

    ```json
    {
      "month": "2025-11",
      "totalIncome": 2000000,
      "totalExpense": 1200000,
      "net": 800000,
      "byCategory": [
        { "categoryName": "Makan", "total": 500000 },
        { "categoryName": "Transport", "total": 200000 }
      ]
    }
    ```

* **Dashboard UI (`app/dashboard/page.tsx`)**

  * Cards:

    * “Total balance across all wallets”
    * “Total expense this month”
    * “Total income this month”
  * Chart:

    * Pie chart for `byCategory` (expenses only), OR
    * Bar chart per category

* **Implementation hints**

  * Fetch summary on the server using Prisma.
  * Use a client component for charts (e.g. Recharts).

---

### 🎯 Phase 4 — Budgets & Savings Goals (Optional)

**Budgets**

* New model: `Budget` (userId, categoryId, month, amount)
* Show progress:

  * `spent / budget` (%) and highlight when over budget.

**Savings goals**

* New model: `Goal` (userId, name, targetAmount, currentAmount, deadline)
* Optionally link certain transactions to a specific goal.

---

### 🎨 Phase 5 — UI Polish, UX, and Deployment

* Improve responsive layout (mobile-first)
* Add loading & error states for all forms, actions, and tables
* Use a consistent component library (e.g. shadcn/ui)
* Deploy to:

  * Vercel (Next.js app + API routes)
  * External DB (Neon, Supabase, Railway, etc.)

---

## API Design Summary (for Implementation)

**Wallets**

* `GET /api/wallets` — list user wallets
* `POST /api/wallets` — create wallet
* `PATCH /api/wallets/[id]` — update wallet
* `DELETE /api/wallets/[id]` — delete wallet

**Categories**

* `GET /api/categories` — list categories
* `POST /api/categories` — create category

**Transactions**

* `GET /api/transactions?from=&to=&walletId=&categoryId=` — list filtered transactions
* `POST /api/transactions` — create transaction
* `PATCH /api/transactions/[id]` — update transaction
* `DELETE /api/transactions/[id]` — delete transaction

**Summary**

* `GET /api/summary/monthly?month=YYYY-MM` — monthly summary for dashboard

All endpoints:

* Derive `userId` from the session (`auth()`) to **scope data per user**.
* Must NOT leak data between users.

---

## Conventions for AI Coding Assistants (Copilot / Codex)

To help AI assistants generate consistent code:

* **Imports**

  * Shared utilities from `@/lib/...`
  * Auth helpers from `@/auth`

* **File locations**

  * Pages: `app/<feature>/page.tsx`
  * API routes: `app/api/<resource>/route.ts` and `app/api/<resource>/[id]/route.ts`
  * Shared helpers: `src/lib/`
  * Shared types: `src/types/`

* **Auth pattern**

  * In server components:

    ```ts
    const session = await auth();
    if (!session?.user) redirect("/login");
    ```

* **Error handling**

  * API routes return JSON `{ error: string }` with appropriate HTTP status codes (400, 401, 403, 500).

When adding a new feature, follow the existing naming and folder structure to keep the project clean and consistent.

---

## License

You may choose any license (MIT is a common choice for portfolio projects).
If none is specified, treat this as a personal learning project.

```

Tinggal kamu paste ke `README.md`, commit, dan push.  
Habis itu, Copilot/Codex di VS Code bakal punya “spesifikasi lengkap” buat ngerjain Phase 3 (wallet, transactions, summary) mengikuti struktur `app/` + `src/` yang kamu pakai sekarang.
```
