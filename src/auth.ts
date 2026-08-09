import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({ credentials: { email: {}, password: {} }, authorize: async (raw) => {
    const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(raw);
    if (!parsed.success) return null;
    const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
    return { id: user.id, email: user.email, name: user.name };
  } })],
  callbacks: {
    jwt({ token, user }) { if (user) token.id = user.id; return token; },
    session({ session, token }) { if (session.user) session.user.id = token.id as string; return session; }
  }
});
