import { NextResponse } from "next/server";
import { telegramCall, reservationSummary, editAllReservationMessages, type TgMessageRef } from "@/lib/notify";
import { confirmReservation, cancelReservation, freeTablesForDate, notifyGuestConfirmed } from "@/lib/reservationActions";
import { LARGE_GROUP, TABLES } from "@/lib/tables";
import { prisma } from "@/lib/db";

const VALID_TABLE_NOS = new Set(TABLES.map((t) => t.no));

// Telegram delivers button presses here. Secured by a secret token set on the
// webhook (Telegram echoes it in this header) plus a chat-id allowlist.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const allow = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  // Text commands: staff can enter a booking straight from the chat.
  const msg = update?.message;
  if (msg?.text) {
    const from = String(msg.chat?.id ?? "");
    if (allow.length && !allow.includes(from)) return NextResponse.json({ ok: true });
    await handleCommand(from, String(msg.text).trim());
    return NextResponse.json({ ok: true });
  }

  const cb = update?.callback_query;
  if (!cb) return NextResponse.json({ ok: true }); // ignore other updates
  const chatId = String(cb.message?.chat?.id ?? "");
  if (allow.length && !allow.includes(chatId)) {
    await telegramCall("answerCallbackQuery", { callback_query_id: cb.id, text: "Brak uprawnień." });
    return NextResponse.json({ ok: true });
  }

  const parts = String(cb.data ?? "").split(":");
  const action = parts[0];
  const id = Number(parts[1]);
  const ack = (text?: string) => telegramCall("answerCallbackQuery", { callback_query_id: cb.id, ...(text ? { text } : {}) });

  if (!Number.isInteger(id)) {
    await ack();
    return NextResponse.json({ ok: true });
  }

  const editMessage = (text: string, replyMarkup?: unknown) =>
    telegramCall("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });

  // Terminal update: rewrite the alert in EVERY chat it was sent to (cross-account
  // sync), so a confirm/reject from one staff account shows on all the others.
  const syncAll = async (reservation: { tgMessages?: string } | null, text: string) => {
    let refs: TgMessageRef[] = [];
    try { refs = JSON.parse(reservation?.tgMessages || "[]"); } catch { /* ignore */ }
    if (refs.length) await editAllReservationMessages(refs, text);
    else await editMessage(text); // fallback: only the acting message
  };

  // ── Step 1: "Przyjmij" → show the table picker (does not confirm yet) ──
  if (action === "confirm") {
    const r = await prisma.reservation.findUnique({ where: { id } });
    if (!r) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }

    const free = await freeTablesForDate(r.date, r.id);
    const big = r.guests >= LARGE_GROUP;
    // Tie the choice to party size: tables that seat the group (+ terrace for big
    // groups). If nothing fits, fall back to every free table for the day.
    const fitting = free
      .filter((t) => t.seats >= r.guests || (t.outdoor && big))
      .sort((a, b) => a.seats - b.seats);
    const list = fitting.length ? fitting : free;

    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < list.length; i += 4) {
      rows.push(list.slice(i, i + 4).map((t) => ({
        text: `${t.outdoor ? "🌿" : ""}${t.no}·${t.seats}os`,
        callback_data: `table:${r.id}:${t.no}`,
      })));
    }
    rows.push([
      { text: "✅ Bez stołu", callback_data: `notable:${r.id}` },
      { text: "❌ Odrzuć", callback_data: `cancel:${r.id}` },
    ]);
    await ack();
    const note = fitting.length
      ? `🪑 <b>Wolne stoły na ${r.date}</b> pod 👥 ${r.guests} os.:`
      : `🪑 <b>Brak stołu na tylu osób.</b> Wszystkie wolne na ${r.date}:`;
    await editMessage(`${reservationSummary(r)}\n\n${note}`, { inline_keyboard: rows });
    return NextResponse.json({ ok: true });
  }

  // ── Step 2: a table was chosen → confirm + assign + notify ──
  if (action === "table") {
    const tableNo = Number(parts[2]);
    const res = await confirmReservation(id, Number.isInteger(tableNo) ? tableNo : undefined);
    if (!res.ok || !res.reservation) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }
    await ack(res.alreadyConfirmed ? `Stół ${tableNo} przypisany.` : `Przyjęta ✅ Stół ${tableNo} — powiadomienie wysłane.`);
    await syncAll(res.reservation, `${reservationSummary(res.reservation)}\n\n✅ <b>PRZYJĘTA</b> · Stół ${tableNo}`);
    return NextResponse.json({ ok: true });
  }

  // Confirm without a table.
  if (action === "notable") {
    const res = await confirmReservation(id);
    if (!res.ok || !res.reservation) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }
    await ack(res.alreadyConfirmed ? "Już przyjęta." : "Przyjęta ✅ — powiadomienie wysłane.");
    await syncAll(res.reservation, `${reservationSummary(res.reservation)}\n\n✅ <b>PRZYJĘTA</b>`);
    return NextResponse.json({ ok: true });
  }

  // Reject.
  if (action === "cancel") {
    const res = await cancelReservation(id);
    if (!res.ok || !res.reservation) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }
    await ack("Odrzucona ❌");
    await syncAll(res.reservation, `${reservationSummary(res.reservation)}\n\n❌ <b>ODRZUCONA</b>`);
    return NextResponse.json({ ok: true });
  }

  await ack();
  return NextResponse.json({ ok: true });
}

const HELP = [
  "🗓 <b>Ręczna rezerwacja</b>",
  "",
  "Wyślij:",
  "<code>/rezerwacja DATA GODZ OSOBY IMIĘ [TELEFON] [stół]</code>",
  "",
  "Przykłady:",
  "<code>/rezerwacja 2026-08-05 20:00 4 Jan 500100200 5</code>",
  "<code>/rezerwacja dzis 21:30 2 Anna</code>",
  "<code>/rezerwacja jutro 19:00 6 Piotr 600200300</code>",
  "",
  "Data: <code>RRRR-MM-DD</code>, <code>dzis</code> lub <code>jutro</code>.",
  "Ostatnia liczba (1–24) to numer stołu — nieobowiązkowa.",
].join("\n");

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Handles chat commands: /start, /help and /rezerwacja. */
async function handleCommand(chatId: string, text: string): Promise<void> {
  const send = (t: string) => telegramCall("sendMessage", { chat_id: chatId, text: t, parse_mode: "HTML" });
  const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, "");

  if (cmd === "/start" || cmd === "/help" || cmd === "/pomoc") return void (await send(HELP));
  if (cmd !== "/rezerwacja" && cmd !== "/new" && cmd !== "/nowa") return;

  const args = text.split(/\s+/).slice(1);
  if (args.length < 4) return void (await send("⚠️ Za mało danych.\n\n" + HELP));

  let [date, time, guestsRaw, ...rest] = args;
  const lower = date.toLowerCase();
  if (lower === "dzis" || lower === "dziś" || lower === "today") date = dayOffset(0);
  else if (lower === "jutro" || lower === "tomorrow") date = dayOffset(1);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return void (await send("⚠️ Zła data. Użyj RRRR-MM-DD, „dzis” lub „jutro”."));
  if (!/^\d{1,2}:\d{2}$/.test(time)) return void (await send("⚠️ Zła godzina. Użyj HH:MM, np. 20:00."));
  time = time.padStart(5, "0");

  const guests = Number(guestsRaw);
  if (!Number.isInteger(guests) || guests < 1 || guests > 60) return void (await send("⚠️ Zła liczba gości."));

  // Trailing 1–24 is the table number; a longer digit run is the phone.
  let tableNo: number | null = null;
  if (rest.length > 1 && /^\d{1,2}$/.test(rest[rest.length - 1])) {
    const n = Number(rest[rest.length - 1]);
    if (VALID_TABLE_NOS.has(n)) { tableNo = n; rest = rest.slice(0, -1); }
  }
  const phone = rest.length > 1 && /^[+\d][\d\s-]{5,}$/.test(rest[rest.length - 1]) ? rest.pop()! : "";
  const name = rest.join(" ").trim();
  if (name.length < 2) return void (await send("⚠️ Podaj imię gościa."));

  if (tableNo) {
    const busy = await prisma.reservation.findFirst({
      where: { date, tableNo, status: { in: ["confirmed", "seated"] } },
      select: { time: true, name: true },
    });
    if (busy) await send(`⚠️ Uwaga: stół ${tableNo} jest już zajęty (${busy.time} ${busy.name}). Zapisuję mimo to.`);
  }

  const reservation = await prisma.reservation.create({
    data: { date, time, guests, name, phone, email: "", comment: "", zone: "", tableNo, status: "confirmed" },
  });
  await notifyGuestConfirmed(reservation);

  await send(
    `✅ <b>Rezerwacja dodana</b>\n\n` +
      `👤 ${name}\n📅 ${date}, ${time}\n👥 ${guests} os.` +
      (tableNo ? `\n🪑 Stół ${tableNo}` : "") +
      (phone ? `\n📞 ${phone}` : "") +
      `\n\n🆔 #${reservation.id} — widoczna w panelu na stronie.`
  );
}
