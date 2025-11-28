// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const runtime = "nodejs";

// NextAuth butuh GET & POST
export const { GET, POST } = handlers;
