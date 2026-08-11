import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth(); if (!session?.user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const token = randomBytes(32).toString("base64url"); const tokenHash = createHash("sha256").update(token).digest("hex"); const expiresAt = new Date(Date.now() + 5 * 60_000);
  await db.$transaction([db.mobileLoginToken.deleteMany({ where: { userId: session.user.id, OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] } }), db.mobileLoginToken.create({ data: { userId: session.user.id, tokenHash, expiresAt } })]);
  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
