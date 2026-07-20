import "server-only";
import { prisma } from "@/lib/db";
import { notifyReservationConfirmed } from "@/lib/notify";
import { sendReservationConfirmedEmail } from "@/lib/email";
import { TABLES } from "@/lib/tables";

const VALID_TABLES = new Set(TABLES.map((t) => t.no));

type Reservation = Awaited<ReturnType<typeof prisma.reservation.findUniqueOrThrow>>;

/** Sends the guest confirmation via SMS + e-mail (both optional/silent). Shared by
 *  the admin panel and the Telegram accept button so both behave identically. */
export async function notifyGuestConfirmed(r: Reservation): Promise<void> {
  await notifyReservationConfirmed(r); // SMS (SMSAPI)

  const [bar, guest] = await Promise.all([
    prisma.bar.findFirst(),
    r.guestId ? prisma.guestUser.findUnique({ where: { id: r.guestId } }) : Promise.resolve(null),
  ]);
  const email = r.email || guest?.email || "";
  if (email) {
    await sendReservationConfirmedEmail({
      reservationId: r.id,
      name: r.name,
      date: r.date,
      time: r.time,
      guests: r.guests,
      tableNo: r.tableNo,
      phone: r.phone,
      email,
      restaurant: {
        name: bar?.name ?? "Balance",
        address: bar?.address ?? "",
        phone: bar?.phone ?? "",
        instagram: bar?.instagram || undefined,
        facebook: bar?.facebook || undefined,
      },
    });
  }
}

/** Confirms a reservation. Notifies the guest only on a fresh pending→confirmed
 *  transition (idempotent — pressing the button twice won't re-notify). */
export async function confirmReservation(
  id: number,
  tableNo?: number,
): Promise<{ ok: boolean; alreadyConfirmed: boolean; reservation?: Reservation }> {
  const before = await prisma.reservation.findUnique({ where: { id } });
  if (!before) return { ok: false, alreadyConfirmed: false };

  const wasConfirmed = before.status === "confirmed";
  const data: { status: string; tableNo?: number } = { status: "confirmed" };
  if (typeof tableNo === "number" && VALID_TABLES.has(tableNo)) data.tableNo = tableNo;

  const r = await prisma.reservation.update({ where: { id }, data });
  if (!wasConfirmed) await notifyGuestConfirmed(r); // notify only on the first confirm
  return { ok: true, alreadyConfirmed: wasConfirmed, reservation: r };
}

/** Free tables for a date (excludes tables held by other active reservations). */
export async function freeTablesForDate(date: string, excludeReservationId: number): Promise<typeof TABLES> {
  const busy = await prisma.reservation.findMany({
    where: { date, status: { in: ["confirmed", "seated"] }, tableNo: { not: null }, id: { not: excludeReservationId } },
    select: { tableNo: true },
  });
  const taken = new Set(busy.map((b) => b.tableNo));
  return TABLES.filter((t) => !taken.has(t.no));
}

/** Cancels a reservation and frees its table. */
export async function cancelReservation(id: number): Promise<{ ok: boolean; reservation?: Reservation }> {
  const before = await prisma.reservation.findUnique({ where: { id } });
  if (!before) return { ok: false };
  const r = await prisma.reservation.update({ where: { id }, data: { status: "cancelled", tableNo: null } });
  return { ok: true, reservation: r };
}
