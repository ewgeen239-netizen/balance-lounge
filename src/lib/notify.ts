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
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const text =
  ` 🆕 Nowa rezerwacja — BALANCE 

` +
  `👤 Liczba gości: ${r.guests}
` +
  `📅 Termin: ${r.date}, godz. ${r.time}`;

  if (!token || chatIds.length === 0) {
    console.info("[notify] Telegram not configured, skipping. Reservation:\n" + text);
    return;
  }
  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
        if (!res.ok) {
          console.error(`[notify] Telegram send failed for ${chatId}:`, await res.text());
        }
      } catch (err) {
        console.error(`[notify] Telegram send failed for ${chatId}:`, err);
      }
    }),
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
