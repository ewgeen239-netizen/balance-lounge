import "server-only";
import { prisma } from "@/lib/db";
import { telegramCall } from "@/lib/notify";
import { TABLES, LARGE_GROUP, TERRACE_LABEL } from "@/lib/tables";
import { notifyGuestConfirmed } from "@/lib/reservationActions";

// Button-driven "new booking" flow. The picked values ride along inside
// callback_data (date|time|guests|table), so no server-side session is needed:
//   nw:date            → pick a date
//   nw:time:D          → pick a time
//   nw:guests:D:T      → pick party size
//   nw:table:D:T:G     → pick a table
//   nw:save:D:T:G:S    → ask for the name, then create on reply
const PREFIX = "nw";
const NO_TABLE = "x";

type Btn = { text: string; callback_data: string };
const rows = (btns: Btn[], perRow: number): Btn[][] => {
  const out: Btn[][] = [];
  for (let i = 0; i < btns.length; i += perRow) out.push(btns.slice(i, i + perRow));
  return out;
};

const WEEKDAYS = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];

function dayOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (d: Date, i: number) =>
  i === 0 ? "Dziś" : i === 1 ? "Jutro" : `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`;

/** Times the venue actually takes bookings for (16:00 – 01:00, every 30 min). */
function timeSlots(): string[] {
  const out: string[] = [];
  for (let m = 16 * 60; m <= 25 * 60; m += 30) {
    const h = Math.floor(m / 60) % 24;
    out.push(`${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export const isWizardCallback = (data: string) => data.startsWith(PREFIX + ":");

/** Entry keyboard shown by /start and /rezerwacja. */
export const startKeyboard = () => ({
  inline_keyboard: [[{ text: "➕ Nowa rezerwacja", callback_data: `${PREFIX}:date` }]],
});

/** Handles every wizard button press. Returns the toast for answerCallbackQuery. */
export async function handleWizard(
  chatId: string | number,
  messageId: number,
  data: string,
): Promise<string> {
  const [, step, ...rest] = data.split(":");
  const edit = (text: string, keyboard: Btn[][]) =>
    telegramCall("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });

  // Step 1 — date
  if (step === "date") {
    const days = Array.from({ length: 8 }, (_, i) => dayOffset(i));
    const btns = days.map((d, i) => ({ text: dayLabel(d, i), callback_data: `${PREFIX}:time:${iso(d)}` }));
    await edit("🗓 <b>Nowa rezerwacja</b>\n\nWybierz dzień:", rows(btns, 4));
    return "";
  }

  // Step 2 — time
  if (step === "time") {
    const [date] = rest;
    const btns = timeSlots().map((t) => ({ text: t, callback_data: `${PREFIX}:guests:${date}:${t}` }));
    await edit(`🗓 <b>${date}</b>\n\nWybierz godzinę:`, [
      ...rows(btns, 4),
      [{ text: "‹ Zmień dzień", callback_data: `${PREFIX}:date` }],
    ]);
    return "";
  }

  // Step 3 — party size
  if (step === "guests") {
    const [date, time] = rest;
    const btns = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
      text: String(n),
      callback_data: `${PREFIX}:table:${date}:${time}:${n}`,
    }));
    await edit(`🗓 <b>${date}, ${time}</b>\n\nIle osób?`, [
      ...rows(btns, 6),
      [{ text: "‹ Zmień godzinę", callback_data: `${PREFIX}:time:${date}` }],
    ]);
    return "";
  }

  // Step 4 — table (free ones for that day, sized for the party)
  if (step === "table") {
    const [date, time, guestsRaw] = rest;
    const guests = Number(guestsRaw);
    const busy = await prisma.reservation.findMany({
      where: { date, status: { in: ["confirmed", "seated"] }, tableNo: { not: null } },
      select: { tableNo: true },
    });
    const taken = new Set(busy.map((b) => b.tableNo));
    const big = guests >= LARGE_GROUP;
    const free = TABLES.filter((t) => !taken.has(t.no));
    const fitting = free.filter((t) => t.seats >= guests || (t.outdoor && big));
    const list = (fitting.length ? fitting : free).sort((a, b) => a.seats - b.seats);

    const btns = list.map((t) => ({
      text: `${t.outdoor ? "🌿" : ""}${t.no} · ${t.seats}os`,
      callback_data: `${PREFIX}:save:${date}:${time}:${guests}:${t.no}`,
    }));
    const note = fitting.length
      ? `Wolne stoły na ${guests} os.${big ? ` (🌿 = ${TERRACE_LABEL})` : ""}:`
      : "Brak stołu na tylu osób — wszystkie wolne:";
    await edit(`🗓 <b>${date}, ${time}</b> · 👥 ${guests} os.\n\n${note}`, [
      ...rows(btns, 4),
      [
        { text: "Bez stołu", callback_data: `${PREFIX}:save:${date}:${time}:${guests}:${NO_TABLE}` },
        { text: "‹ Zmień liczbę", callback_data: `${PREFIX}:guests:${date}:${time}` },
      ],
    ]);
    return "";
  }

  // Step 5 — ask for the guest's name; the reply carries the state back.
  if (step === "save") {
    const [date, time, guests, table] = rest;
    await edit(
      `🗓 <b>${date}, ${time}</b> · 👥 ${guests} os.` +
        (table === NO_TABLE ? "" : ` · 🪑 Stół ${table}`) +
        `\n\n✍️ <b>Odpowiedz na tę wiadomość</b> imieniem gościa (opcjonalnie telefon).\n` +
        `Np. <code>Jan 500100200</code>`,
      [],
    );
    // force_reply so staff can just tap and type; the state is in this message.
    await telegramCall("sendMessage", {
      chat_id: chatId,
      text: `✍️ Imię gościa? ⟨${date}|${time}|${guests}|${table}⟩`,
      reply_markup: { force_reply: true, input_field_placeholder: "Jan 500100200" },
    });
    return "";
  }

  return "";
}

/** Creates the booking when staff reply to the "name?" prompt. */
export async function handleWizardReply(
  chatId: string | number,
  promptText: string,
  answer: string,
): Promise<boolean> {
  const m = promptText.match(/⟨([^|]+)\|([^|]+)\|([^|]+)\|([^⟩]+)⟩/);
  if (!m) return false;

  const [, date, time, guestsRaw, tableRaw] = m;
  const guests = Number(guestsRaw);
  const tableNo = tableRaw === NO_TABLE ? null : Number(tableRaw);

  const parts = answer.trim().split(/\s+/);
  const phone = parts.length > 1 && /^[+\d][\d\s-]{5,}$/.test(parts[parts.length - 1]) ? parts.pop()! : "";
  const name = parts.join(" ").trim();

  const send = (t: string) => telegramCall("sendMessage", { chat_id: chatId, text: t, parse_mode: "HTML" });
  if (name.length < 2) {
    await send("⚠️ Podaj imię gościa (min. 2 znaki). Spróbuj jeszcze raz: /rezerwacja");
    return true;
  }

  const reservation = await prisma.reservation.create({
    data: { date, time, guests, name, phone, email: "", comment: "", zone: "", tableNo, status: "confirmed" },
  });
  await notifyGuestConfirmed(reservation);

  await send(
    `✅ <b>Rezerwacja dodana</b>\n\n👤 ${name}\n📅 ${date}, ${time}\n👥 ${guests} os.` +
      (tableNo ? `\n🪑 Stół ${tableNo}` : "") +
      (phone ? `\n📞 ${phone}` : "") +
      `\n\n🆔 #${reservation.id} — widoczna w panelu na stronie.`,
  );
  return true;
}
