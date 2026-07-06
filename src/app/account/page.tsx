import { getGuestSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthForm } from "@/components/account/AuthForm";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { PageHeading } from "@/components/PageHeading";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getGuestSession();

  let guest = null;
  if (session) {
    guest = await prisma.guestUser.findUnique({
      where: { id: Number(session.sub) },
      include: { reservations: { orderBy: [{ date: "desc" }, { time: "desc" }] } },
    });
  }

  return (
    <div className="pb-16 pt-10">
      <PageHeading titleKey="acc.title" />
      <div className="container-x">
        {guest ? (
          <AccountDashboard
            name={guest.name}
            email={guest.email ?? ""}
            reservations={guest.reservations.map((r) => ({
              id: r.id,
              date: r.date,
              time: r.time,
              guests: r.guests,
              zone: r.zone,
              status: r.status,
              comment: r.comment,
            }))}
          />
        ) : (
          <AuthForm />
        )}
      </div>
    </div>
  );
}
