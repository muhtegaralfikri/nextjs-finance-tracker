// src/auth.ts
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const resolvedSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!resolvedSecret) {
  console.error("[auth] Missing AUTH_SECRET/NEXTAUTH_SECRET");
} else {
  console.log("[auth] using secret length", resolvedSecret.length);
}

const authConfig: NextAuthConfig = {
  secret: resolvedSecret,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : null;
        const password =
          typeof credentials?.password === "string" ? credentials.password : null;

        // Validasi input basic
        if (!email || !password) {
          return null;
        }

        // Cari user di DB
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // Cek password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) return null;

        // Return data user yang aman (tanpa password)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  },
  pages: {
    signIn: "/login", // kalau belom login & butuh auth → ke /login
  },
  callbacks: {
    async jwt({ token, user }) {
      // Saat pertama kali login, "user" terisi
      if (user?.id) {
        // simpan id di token
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Tambahkan id ke session.user
      const tokenId = (token as JWT).id;
      if (session.user && typeof tokenId === "string") {
        session.user.id = tokenId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
