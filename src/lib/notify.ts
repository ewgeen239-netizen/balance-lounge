import "server-only";

type ReservationLike = {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  zone?: string;
  comment?: string;
};

/** Sends a Telegram message about a new reservation if bot env vars are configured.
 *  Fails silently (logs only) so booking never breaks because of notification issues. */
export async function notifyNewReservation(r: ReservationLike): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text =
    `🆕 Nowa rezerwacja — BALANCE\n\n` +
    `👤 ${r.name}\n📞 ${r.phone}\n📅 ${r.date} ${r.time}\n👥 ${r.guests}\n` +
    (r.zone ? `📍 ${r.zone}\n` : "") +
    (r.comment ? `💬 ${r.comment}\n` : "");

  if (!token || !chatId) {
    console.info("[notify] Telegram not configured, skipping. Reservation:\n" + text);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("[notify] Telegram send failed:", err);
  }
}
