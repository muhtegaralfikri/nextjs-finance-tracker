import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiValidationError, apiServerError } from "@/lib/api";
import { rateLimiters, getClientIp } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const logger = createLogger("api:register");

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, huruf kecil, dan angka"
    ),
});

export async function POST(request: Request) {
  try {
    // Rate limiting for auth endpoints
    const ip = getClientIp(request);
    const rateLimitResult = rateLimiters.auth(ip);

    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded", { ip });
      return apiError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.", 429);
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;

    // Sanitize name input
    const sanitizedName = sanitizeInput(name);

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      logger.info("Registration attempt with existing email", { email });
      return apiError("Email sudah terdaftar", 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    logger.info("User registered successfully", { userId: user.id });

    return apiSuccess({ user }, 201);
  } catch (error) {
    logger.error("Registration failed", error);
    return apiServerError(error);
  }
}
