import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Returns the current session user, or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws UnauthorizedError unless an ADMIN/EDITOR is signed in. Use in actions/handlers. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    throw new UnauthorizedError();
  }
  return user;
}
