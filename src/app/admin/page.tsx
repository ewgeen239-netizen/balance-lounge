import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminApp } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [categories, reservations, bar, about] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } }),
    prisma.reservation.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
    prisma.bar.findFirst(),
    prisma.aboutContent.findFirst(),
  ]);

  return (
    <AdminApp
      adminName={session.name ?? "admin"}
      initialCategories={JSON.parse(JSON.stringify(categories))}
      initialReservations={JSON.parse(JSON.stringify(reservations))}
      bar={JSON.parse(JSON.stringify(bar))}
      about={JSON.parse(JSON.stringify(about))}
    />
  );
}
