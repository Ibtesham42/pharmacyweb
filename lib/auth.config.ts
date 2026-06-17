import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config (no Prisma / bcrypt). Used by middleware for route
// protection and shared by the full config in `lib/auth.ts`.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // real providers are added in lib/auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as { role?: string } | undefined;
      const isLoggedIn = !!user;
      const isAdmin = user?.role === "ADMIN" || user?.role === "EDITOR";
      const path = nextUrl.pathname;

      const isAdminArea = path.startsWith("/admin");
      const isAdminLogin = path === "/admin/login";
      // Account/dashboard area, excluding its own public auth pages.
      const isAccountArea =
        (path === "/account" || path.startsWith("/account/")) &&
        path !== "/account/login" &&
        path !== "/account/verify";

      // Admin area is restricted to ADMIN/EDITOR roles.
      if (isAdminArea && !isAdminLogin) {
        if (!isLoggedIn) return false; // → redirect to signIn (/login) with callbackUrl
        if (!isAdmin) return Response.redirect(new URL("/account", nextUrl)); // signed-in non-admin
        return true;
      }

      // Account/dashboard requires any signed-in user.
      if (isAccountArea) return isLoggedIn;

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
