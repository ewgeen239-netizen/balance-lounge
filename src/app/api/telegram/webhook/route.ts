import { NextResponse } from "next/server";
import { telegramCall, reservationSummary } from "@/lib/notify";
import { confirmReservation, cancelReservation, freeTablesForDate } from "@/lib/reservationActions";
import { LARGE_GROUP } from "@/lib/tables";
import { prisma } from "@/lib/db";

// Telegram delivers button presses here. Secured by a secret token set on the
// webhook (Telegram echoes it in this header) plus a chat-id allowlist.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const cb = update?.callback_query;
  if (!cb) return NextResponse.json({ ok: true }); // ignore non-button updates

  const allow = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
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
    await editMessage(`${reservationSummary(res.reservation)}\n\n✅ <b>PRZYJĘTA</b> · Stół ${tableNo}`);
    return NextResponse.json({ ok: true });
  }

  // Confirm without a table.
  if (action === "notable") {
    const res = await confirmReservation(id);
    if (!res.ok || !res.reservation) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }
    await ack(res.alreadyConfirmed ? "Już przyjęta." : "Przyjęta ✅ — powiadomienie wysłane.");
    await editMessage(`${reservationSummary(res.reservation)}\n\n✅ <b>PRZYJĘTA</b>`);
    return NextResponse.json({ ok: true });
  }

  // Reject.
  if (action === "cancel") {
    const res = await cancelReservation(id);
    if (!res.ok || !res.reservation) { await ack("Nie znaleziono rezerwacji."); return NextResponse.json({ ok: true }); }
    await ack("Odrzucona ❌");
    await editMessage(`${reservationSummary(res.reservation)}\n\n❌ <b>ODRZUCONA</b>`);
    return NextResponse.json({ ok: true });
  }

  await ack();
  return NextResponse.json({ ok: true });
}
