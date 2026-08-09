import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
const schema = z.object({ name: z.string().min(2).max(60), email: z.string().email(), password: z.string().min(8).max(72) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "البريد مستخدم مسبقًا" }, { status: 409 });
  const user = await db.user.create({ data: { name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), settings: { create: {} } } });
  await db.auditLog.create({ data: { userId: user.id, action: "REGISTER", entity: "User", entityId: user.id } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
