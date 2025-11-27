// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

// NextAuth butuh GET & POST
export const { GET, POST } = handlers;
