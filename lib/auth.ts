import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyLogin } from "@/services/buyers";
import { ensureUserForEmail } from "@/services/users";

// Full Auth.js instance (Node runtime). One unified system for the whole platform:
//  - "credentials": email + password (admins, editors, registered users)
//  - "magiclink":   verified passwordless link/OTP → a NextAuth session
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user || !user.passwordHash || user.status === "SUSPENDED") return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    Credentials({
      id: "magiclink",
      credentials: { token: {}, email: {}, code: {} },
      authorize: async (credentials) => {
        const token = typeof credentials?.token === "string" ? credentials.token : undefined;
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const code = typeof credentials?.code === "string" ? credentials.code : undefined;

        // Re-verify + consume the one-time token/OTP (hashed, expiring) via the buyer service.
        const buyer = await verifyLogin({ token, email, code });
        if (!buyer) return null;

        const user = await ensureUserForEmail(buyer.email, buyer.name);
        if (user.status === "SUSPENDED") return null;
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
