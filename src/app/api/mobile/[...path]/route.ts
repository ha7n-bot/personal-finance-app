import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: cors });
const secret = () => process.env.MOBILE_API_SECRET || process.env.AUTH_SECRET || "";
const encode = (value: string) => Buffer.from(value).toString("base64url");

function token(userId: string) {
  if (!secret()) throw new Error("MOBILE_API_SECRET is not configured");
  const payload = encode(JSON.stringify({ sub: userId, exp: Date.now() + 30 * 86400000 }));
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}

function userIdFrom(request: NextRequest) {
  const raw = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw || !secret()) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number }; return data.exp > Date.now() ? data.sub : null; } catch { return null; }
}

const moneyJson = (value: Prisma.Decimal | null | undefined) => value?.toFixed(2) ?? "0.00";
const pathOf = async (context: { params: Promise<{ path: string[] }> }) => (await context.params).path || [];
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const path = await pathOf(context); const body = await request.json();
    if (path[0] === "register") {
      const input = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) }).parse(body); const email = input.email.toLowerCase();
      if (await db.user.findUnique({ where: { email } })) return json({ error: "البريد مستخدم مسبقًا" }, 409);
      const user = await db.user.create({ data: { name: input.name, email, passwordHash: await bcrypt.hash(input.password, 12), categories: { create: [{ name: "راتب", color: "#10b981" }, { name: "طعام", color: "#f59e0b", isEssential: true }, { name: "نقل", color: "#3b82f6", isEssential: true }, { name: "ترفيه", color: "#8b5cf6" }] } } });
      return json({ token: token(user.id), user: { id: user.id, name: user.name, email: user.email } }, 201);
    }
    if (path[0] === "login") {
      const input = z.object({ email: z.string().email(), password: z.string() }).parse(body); const user = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (!user?.passwordHash || !await bcrypt.compare(input.password, user.passwordHash)) return json({ error: "بيانات الدخول غير صحيحة" }, 401);
      return json({ token: token(user.id), user: { id: user.id, name: user.name, email: user.email } });
    }
    const userId = userIdFrom(request); if (!userId) return json({ error: "غير مصرح" }, 401);
    if (path[0] === "accounts") {
      const input = z.object({ name: z.string().min(1), type: z.enum(["BANK", "CASH", "INVESTMENT", "EMERGENCY", "SAVINGS"]), openingBalance: z.coerce.number().min(0).default(0) }).parse(body);
      const account = await db.account.create({ data: { userId, name: input.name, type: input.type, openingBalance: new Prisma.Decimal(input.openingBalance) } }); return json({ ...account, openingBalance: moneyJson(account.openingBalance) }, 201);
    }
    if (path[0] === "transactions") {
      const input = z.object({ type: z.nativeEnum(TransactionType), amount: z.coerce.number().positive(), accountId: z.string(), categoryId: z.string().optional(), description: z.string().optional(), occurredAt: z.coerce.date().optional() }).parse(body);
      if (!await db.account.count({ where: { id: input.accountId, userId } })) return json({ error: "الحساب غير صالح" }, 400);
      if (input.categoryId && !await db.category.count({ where: { id: input.categoryId, userId } })) return json({ error: "التصنيف غير صالح" }, 400);
      const transaction = await db.transaction.create({ data: { userId, type: input.type, amount: new Prisma.Decimal(input.amount), sourceAccountId: input.accountId, categoryId: input.categoryId || null, description: input.description, occurredAt: input.occurredAt } }); return json({ ...transaction, amount: moneyJson(transaction.amount) }, 201);
    }
    return json({ error: "المسار غير موجود" }, 404);
  } catch (error) { return json({ error: error instanceof z.ZodError ? "بيانات الطلب غير صالحة" : "تعذر تنفيذ الطلب" }, 400); }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await pathOf(context); if (path[0] === "health") return json({ status: "ok", service: "personal-finance-mobile-api", version: "1.0" });
  const userId = userIdFrom(request); if (!userId) return json({ error: "غير مصرح" }, 401);
  if (path[0] === "accounts") { const rows = await db.account.findMany({ where: { userId, isArchived: false }, orderBy: { createdAt: "asc" } }); return json(rows.map(row => ({ ...row, openingBalance: moneyJson(row.openingBalance) }))); }
  if (path[0] === "categories") return json(await db.category.findMany({ where: { userId }, orderBy: { name: "asc" } }));
  if (path[0] === "transactions") { const rows = await db.transaction.findMany({ where: { userId }, include: { category: true, sourceAccount: true }, orderBy: { occurredAt: "desc" }, take: 100 }); return json(rows.map(row => ({ ...row, amount: moneyJson(row.amount) }))); }
  if (path[0] === "dashboard") {
    const [accounts, totals, recent] = await Promise.all([db.account.findMany({ where: { userId, isArchived: false } }), db.transaction.groupBy({ by: ["type"], where: { userId, status: "POSTED" }, _sum: { amount: true } }), db.transaction.findMany({ where: { userId }, include: { category: true }, orderBy: { occurredAt: "desc" }, take: 10 })]);
    const total = (type: TransactionType) => totals.find(row => row.type === type)?._sum.amount || new Prisma.Decimal(0); const balance = accounts.reduce((sum, account) => sum.plus(account.openingBalance), new Prisma.Decimal(0)).plus(total("INCOME")).minus(total("EXPENSE")).minus(total("SAVING")).minus(total("INVESTMENT")).minus(total("DEBT_PAYMENT"));
    return json({ balance: moneyJson(balance), income: moneyJson(total("INCOME")), expenses: moneyJson(total("EXPENSE")), accountsCount: accounts.length, recent: recent.map(row => ({ ...row, amount: moneyJson(row.amount) })) });
  }
  return json({ error: "المسار غير موجود" }, 404);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await pathOf(context); const userId = userIdFrom(request); if (!userId) return json({ error: "غير مصرح" }, 401);
  if (path[0] === "transactions" && path[1]) { const result = await db.transaction.deleteMany({ where: { id: path[1], userId } }); return result.count ? json({ deleted: true }) : json({ error: "العملية غير موجودة" }, 404); }
  return json({ error: "المسار غير موجود" }, 404);
}
