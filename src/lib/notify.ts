import "server-only";

type ReservationLike = {
  id: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  zone?: string;
  comment?: string;
};

const TG_API = (method: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

const esc = (s: string) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

/** Low-level Telegram Bot API call. Returns the parsed JSON (or null on error). */
export async function telegramCall(method: string, payload: Record<string, unknown>): Promise<any> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(TG_API(method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || (json && json.ok === false)) console.error(`[notify] Telegram ${method} failed:`, JSON.stringify(json));
    return json;
  } catch (err) {
    console.error(`[notify] Telegram ${method} failed:`, err);
    return null;
  }
}

export function reservationSummary(r: ReservationLike): string {
  return (
    `🆕 <b>Nowa rezerwacja — BALANCE</b>\n\n` +
    `👤 ${esc(r.name)}\n` +
    `📞 ${esc(r.phone)}\n` +
    `📅 ${esc(r.date)}, godz. ${esc(r.time)}\n` +
    `👥 Liczba gości: ${r.guests}` +
    (r.comment ? `\n📝 ${esc(r.comment)}` : ``) +
    `\n\n🆔 Rezerwacja #${r.id}`
  );
}

/** Inline "confirm / reject" keyboard tied to a reservation. */
export const reservationKeyboard = (id: number) => ({
  inline_keyboard: [[
    { text: "✅ Przyjmij", callback_data: `confirm:${id}` },
    { text: "❌ Odrzuć", callback_data: `cancel:${id}` },
  ]],
});

/** Sends a Telegram message about a new reservation with accept/reject buttons.
 *  Fails silently (logs only) so booking never breaks because of notification issues. */
export async function notifyNewReservation(r: ReservationLike): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const text = reservationSummary(r);

  if (!token || chatIds.length === 0) {
    console.info("[notify] Telegram not configured, skipping. Reservation:\n" + text);
    return;
  }
  await Promise.allSettled(
    chatIds.map((chatId) =>
      telegramCall("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: reservationKeyboard(r.id),
      }),
    ),
  );
}

/** Normalize a phone number to international digits for SMSAPI.
 *  Local 9-digit Polish numbers get a +48 country code. */
function normalizePhonePL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return "48" + digits; // bare Polish mobile
  if (digits.startsWith("00")) return digits.slice(2); // 00-prefixed international
  return digits; // assume it already carries a country code
}

type ConfirmedReservationLike = ReservationLike & { tableNo?: number | null };

/** Sends an SMS to the guest confirming their reservation (via SMSAPI.pl).
 *  Fails silently (logs only) so confirming never breaks on SMS issues. */
export async function notifyReservationConfirmed(r: ConfirmedReservationLike): Promise<void> {
  const token = process.env.SMSAPI_TOKEN;
  const from = process.env.SMSAPI_SENDER; // approved sender name; optional
  const to = normalizePhonePL(r.phone || "");
  const firstName = (r.name || "").trim().split(/\s+/)[0];
  const hi = firstName ? `Cześć ${firstName}! ` : "";
  const table = r.tableNo ? `, stolik nr ${r.tableNo}` : "";
  const message = `${hi}Twoja rezerwacja w BALANCE na ${r.date} o godz. ${r.time}${table} została potwierdzona. Do zobaczenia!`;

  if (!token || !to) {
    console.info("[notify] SMSAPI not configured or no phone, skipping SMS:\n" + message);
    return;
  }

  const params = new URLSearchParams({ to, message, format: "json", encoding: "utf-8" });
  if (from) params.set("from", from);

  try {
    const res = await fetch("https://api.smsapi.pl/sms.do", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await res.text();
    let data: { error?: unknown } = {};
    try { data = JSON.parse(body); } catch { /* non-JSON error page */ }
    if (!res.ok || data.error) {
      console.error("[notify] SMSAPI send failed:", body);
    }
  } catch (err) {
    console.error("[notify] SMSAPI send failed:", err);
  }
}
