import { createHash } from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureUserWorkspace } from "@/lib/bootstrap-user";

const credentialsProvider = Credentials({
  name: "البريد الإلكتروني وكلمة المرور",
  credentials: { email: { type: "email" }, password: { type: "password" } },
  authorize: async (raw) => {
    const parsed = z.object({ email: z.string().email(), password: z.string().min(8).max(72) }).safeParse(raw);
    if (!parsed.success) return null;
    const user = await db.user.findUnique({ where: { email: parsed.data.email.trim().toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
    return { id: user.id, email: user.email, name: user.name, image: user.image };
  },
});

const mobileTokenProvider = Credentials({
  id: "mobile-token",
  name: "رمز تطبيق مالي",
  credentials: { token: { type: "password" } },
  authorize: async (raw) => {
    const parsed = z.object({ token: z.string().min(32).max(256) }).safeParse(raw);
    if (!parsed.success) return null;
    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const record = await db.mobileLoginToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) return null;
    const consumed = await db.mobileLoginToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return null;
    return { id: record.user.id, email: record.user.email, name: record.user.name, image: record.user.image };
  },
});

const providers: NextAuthConfig["providers"] = [credentialsProvider, mobileTokenProvider];
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
if (googleEnabled) providers.unshift(Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  allowDangerousEmailAccountLinking: true,
}));

export const authConfig = {
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && (profile as { email_verified?: boolean } | undefined)?.email_verified !== true) return false;
      if (user.id) await ensureUserWorkspace(user.id);
      return true;
    },
    jwt({ token, user }) { if (user?.id) token.id = user.id; return token; },
    session({ session, token }) { if (session.user && token.id) session.user.id = String(token.id); return session; },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export { googleEnabled };
