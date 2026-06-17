import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge middleware uses the Prisma-free config; it only reads/validates the JWT
// and applies the `authorized` callback to gate the /admin area.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
