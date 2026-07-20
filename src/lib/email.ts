import "server-only";

export type ConfirmEmailData = {
  reservationId: number;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
  tableNo?: number | null;
  phone: string;
  email: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    instagram?: string;
    facebook?: string;
  };
};

const BRAND = { ember: "#e07a3f", ink: "#000000", card: "#101012", line: "#26262c", text: "#ededf0", muted: "#9a9aa2" };

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/** Google Calendar "add event" link (2h slot, local/floating time). */
function calendarUrl(d: ConfirmEmailData): string {
  const start = `${d.date.replace(/-/g, "")}T${d.time.replace(":", "")}00`;
  const [h, m] = d.time.split(":").map(Number);
  const end = `${d.date.replace(/-/g, "")}T${String((h + 2) % 24).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Rezerwacja — ${d.restaurant.name}`,
    dates: `${start}/${end}`,
    location: d.restaurant.address,
    details: `Rezerwacja nr ${d.reservationId} · ${d.guests} os.`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const mapsUrl = (address: string) => `https://maps.google.com/?q=${encodeURIComponent(address)}`;

/** Builds the guest reservation-confirmation email (subject + HTML + plain text). */
export function reservationConfirmedEmail(d: ConfirmEmailData): { subject: string; html: string; text: string } {
  const table = d.tableNo ? ` · stolik nr ${d.tableNo}` : "";
  const subject = `Rezerwacja potwierdzona — ${d.restaurant.name} · ${d.date}, ${d.time}`;

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;color:${BRAND.muted};font-size:13px;">${esc(label)}</td>
      <td style="padding:6px 0;color:${BRAND.text};font-size:13px;text-align:right;font-weight:600;">${esc(value)}</td>
    </tr>`;

  const btn = (href: string, text: string) =>
    `<a href="${href}" style="display:inline-block;padding:11px 18px;border:1px solid ${BRAND.line};border-radius:10px;color:${BRAND.text};text-decoration:none;font-size:14px;margin:4px 6px 4px 0;">${esc(text)}</a>`;

  const socials = [
    d.restaurant.instagram ? `<a href="${esc(d.restaurant.instagram)}" style="color:${BRAND.ember};text-decoration:none;">Instagram</a>` : "",
    d.restaurant.facebook ? `<a href="${esc(d.restaurant.facebook)}" style="color:${BRAND.ember};text-decoration:none;">Facebook</a>` : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.ink};background-color:${BRAND.ink};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">Do zobaczenia w ${esc(d.restaurant.name)}! Twoja rezerwacja jest potwierdzona.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.ink}" style="background:${BRAND.ink};background-color:${BRAND.ink};padding:28px 12px;">
<tr><td align="center" bgcolor="${BRAND.ink}" style="background-color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.card}" style="max-width:560px;background:${BRAND.card};background-color:${BRAND.card};border:1px solid ${BRAND.line};border-radius:18px;overflow:hidden;">
    <!-- header -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:26px 28px 8px;">
      <div style="letter-spacing:6px;font-size:22px;font-weight:800;color:${BRAND.text};">BALANCE</div>
      <div style="letter-spacing:3px;font-size:11px;color:${BRAND.ember};text-transform:uppercase;margin-top:4px;">Coctails &amp; Shisha</div>
    </td></tr>
    <!-- greeting -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:14px 28px 0;">
      <p style="margin:0 0 6px;color:${BRAND.text};font-size:16px;">Dzień dobry, <strong>${esc(d.name)}</strong>!</p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px;line-height:1.5;">Twoja rezerwacja została <strong style="color:${BRAND.ember};">potwierdzona</strong>. Rezerwujemy dla Ciebie miejsce i już nie możemy się doczekać — do zobaczenia w Balance!</p>
    </td></tr>
    <!-- hero -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:18px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(224,122,63,0.14),rgba(224,122,63,0.02));border:1px solid rgba(224,122,63,0.3);border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="color:${BRAND.ember};font-size:22px;font-weight:800;">${esc(d.date)}, ${esc(d.time)}</div>
          <div style="color:${BRAND.text};font-size:15px;margin-top:4px;">Liczba gości: <strong>${d.guests}</strong>${esc(table)}</div>
        </td></tr>
      </table>
    </td></tr>
    <!-- ctas -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:14px 24px 0;">
      ${btn(mapsUrl(d.restaurant.address), "Pokaż na mapie")}
      ${btn(calendarUrl(d), "Dodaj do kalendarza")}
    </td></tr>
    <!-- change / cancel -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:14px 28px 0;">
      <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.5;">Chcesz zmienić szczegóły lub odwołać wizytę? Zadzwoń do nas: <a href="tel:${esc(d.restaurant.phone.replace(/\s/g, ""))}" style="color:${BRAND.ember};text-decoration:none;font-weight:600;">${esc(d.restaurant.phone)}</a>.</p>
    </td></tr>
    <!-- details -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:18px 28px 0;">
      <div style="border-top:1px solid ${BRAND.line};padding-top:14px;">
        <div style="color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Szczegóły rezerwacji</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row("Numer rezerwacji", String(d.reservationId))}
          ${row("Data i czas", `${d.date}, ${d.time}`)}
          ${row("Liczba gości", String(d.guests))}
          ${d.tableNo ? row("Stolik", `nr ${d.tableNo}`) : ""}
          ${row("Imię", d.name)}
          ${row("Telefon", d.phone)}
          ${d.email ? row("E-mail", d.email) : ""}
        </table>
      </div>
    </td></tr>
    <!-- footer -->
    <tr><td bgcolor="${BRAND.card}" style="background-color:${BRAND.card};padding:22px 28px 26px;">
      <div style="border-top:1px solid ${BRAND.line};padding-top:16px;">
        <div style="color:${BRAND.text};font-size:14px;font-weight:600;">${esc(d.restaurant.name)}</div>
        <div style="color:${BRAND.muted};font-size:13px;margin-top:2px;">${esc(d.restaurant.address)}</div>
        <div style="color:${BRAND.muted};font-size:13px;margin-top:2px;">${esc(d.restaurant.phone)}</div>
        ${socials ? `<div style="font-size:13px;margin-top:8px;">${socials}</div>` : ""}
        <p style="margin:16px 0 0;color:${BRAND.text};font-size:14px;">Do zobaczenia w Balance! 🖤<br><span style="color:${BRAND.muted};">Zespół Balance</span></p>
        <p style="margin:14px 0 0;color:${BRAND.muted};font-size:11px;">Wiadomość wygenerowana automatycznie — prosimy na nią nie odpowiadać.</p>
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `Dzień dobry, ${d.name}!`,
    ``,
    `Twoja rezerwacja w ${d.restaurant.name} została potwierdzona. Do zobaczenia!`,
    ``,
    `Data i czas: ${d.date}, ${d.time}`,
    `Liczba gości: ${d.guests}${d.tableNo ? ` (stolik nr ${d.tableNo})` : ""}`,
    `Numer rezerwacji: ${d.reservationId}`,
    ``,
    `Zmiany lub odwołanie: zadzwoń ${d.restaurant.phone}.`,
    `Adres: ${d.restaurant.address}`,
    ``,
    `Zespół Balance`,
    `Wiadomość wygenerowana automatycznie — prosimy na nią nie odpowiadać.`,
  ].join("\n");

  return { subject, html, text };
}

/** Sends the confirmation email via Brevo (transactional). Silent if unconfigured or no address. */
export async function sendReservationConfirmedEmail(d: ConfirmEmailData): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL; // must be a verified sender in Brevo
  const senderName = process.env.BREVO_SENDER_NAME || d.restaurant.name || "Balance";
  if (!key || !senderEmail || !d.email) {
    console.info("[email] Brevo not configured or no recipient — skipping confirmation email.");
    return;
  }
  const { subject, html, text } = reservationConfirmedEmail(d);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: d.email, name: d.name }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) console.error("[email] Brevo send failed:", await res.text());
  } catch (err) {
    console.error("[email] Brevo send failed:", err);
  }
}
