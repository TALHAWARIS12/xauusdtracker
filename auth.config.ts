import type { NextAuthConfig } from "next-auth";

// If NEXTAUTH_URL or AUTH_URL points to xauusdtracker.com before DNS is routed,
// prevent NextAuth from overriding request origins and redirecting users to a dead host.
if (
  process.env.NEXTAUTH_URL?.includes("xauusdtracker.com") ||
  process.env.AUTH_URL?.includes("xauusdtracker.com")
) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    delete process.env.NEXTAUTH_URL;
    delete process.env.AUTH_URL;
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Relative path: keep relative so browser remains on the current host
      if (url.startsWith("/")) {
        return url;
      }
      try {
        const parsed = new URL(url);
        // If redirect URL points to dead custom domain, convert to relative path
        if (parsed.hostname === "xauusdtracker.com") {
          return `${parsed.pathname}${parsed.search}`;
        }
        // If same origin or vercel app, allow it
        if (parsed.origin === baseUrl || parsed.hostname.endsWith(".vercel.app")) {
          return url;
        }
      } catch {}
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  providers: [],
};
