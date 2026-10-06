import Link from "next/link";
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
          <>
            <AuthForm />
            {/* Staff entrance — kept well below the form so guests don't hit it by mistake. */}
            <div className="mt-24 flex justify-center">
              <Link
                href="/admin/login"
                className="rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-neutral-500 transition hover:border-ember/40 hover:text-ember"
              >
                ADM
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
