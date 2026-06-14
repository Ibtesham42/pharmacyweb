import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config (no Prisma / bcrypt). Used by middleware for route
// protection and shared by the full config in `lib/auth.ts`.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [], // real providers are added in lib/auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isLoginPage = path === "/admin/login";
      const isAdminArea = path.startsWith("/admin");

      if (isAdminArea && !isLoginPage) {
        return isLoggedIn; // false → redirect to signIn page
      }
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
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
        session.user.role = (token.role as string) ?? "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
