import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/adminGuard";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const id = Number(params.id);

  const session = await getAdminSession();
  if (session && Number(session.sub) === id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }
  // Never allow deleting the last owner.
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (target?.role === "owner") {
    const owners = await prisma.adminUser.count({ where: { role: "owner" } });
    if (owners <= 1) return NextResponse.json({ error: "last_owner" }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
