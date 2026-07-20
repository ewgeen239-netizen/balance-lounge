import { NextResponse } from "next/server";
import { telegramCall, reservationSummary } from "@/lib/notify";
import { confirmReservation, cancelReservation } from "@/lib/reservationActions";

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

  const [action, idStr] = String(cb.data ?? "").split(":");
  const id = Number(idStr);
  if (!Number.isInteger(id) || (action !== "confirm" && action !== "cancel")) {
    await telegramCall("answerCallbackQuery", { callback_query_id: cb.id });
    return NextResponse.json({ ok: true });
  }

  let toast = "";
  let footer = "";
  let reservation;

  if (action === "confirm") {
    const res = await confirmReservation(id);
    reservation = res.reservation;
    if (!res.ok) toast = "Nie znaleziono rezerwacji.";
    else if (res.alreadyConfirmed) { toast = "Już przyjęta."; footer = "✅ <b>PRZYJĘTA</b>"; }
    else { toast = "Rezerwacja przyjęta ✅ — powiadomienie wysłane."; footer = "✅ <b>PRZYJĘTA</b>"; }
  } else {
    const res = await cancelReservation(id);
    reservation = res.reservation;
    toast = res.ok ? "Rezerwacja odrzucona ❌" : "Nie znaleziono rezerwacji.";
    footer = res.ok ? "❌ <b>ODRZUCONA</b>" : "";
  }

  await telegramCall("answerCallbackQuery", { callback_query_id: cb.id, text: toast });

  if (reservation && footer) {
    // Rewrite the message with the outcome and drop the buttons.
    await telegramCall("editMessageText", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: `${reservationSummary(reservation)}\n\n${footer}`,
      parse_mode: "HTML",
    });
  }

  return NextResponse.json({ ok: true });
}
