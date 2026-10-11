import "server-only";
import webpush from "web-push";
import { waitUntil } from "@vercel/functions";
import { prisma } from "./db";
import { HAND_LANGS, LANGS, LANG_ISO, hasHand, t as tDict, tr, trBase, type Lang } from "./i18n";
import { formatEventRange } from "./events";
import { formatPrice } from "./utils";
import { presetForDay, type PromoText, type PushTopic } from "./pushTopics";
import { translateMany } from "./translate";

// Web Push for the installed app (PWA).
//
// Content changes (new event, new menu item, price change, new category) are
// queued in PushOutbox and announced as one digest once the admin has stopped
// editing for QUIET_MS — so a price-list update is one notification, not twenty,
// and a new item is announced under its final name, not "Nowa pozycja".
// The queue is checked on page views (in the background), by the daily cron and
// from the admin panel ("Wyślij teraz").

const QUIET_MS = 10 * 60_000;
const MAX_WAIT_MS = 2 * 3600_000;
const INACTIVE_MS = 365 * 86_400_000; // privacy policy: dead subscriptions go after 12 months
const PLACEHOLDER_NAMES = new Set(["Nowa pozycja", "New item", ""]);

export type PushMessage = { title: string; body: string; url: string; tag?: string };
type Source = "auto" | "manual" | "schedule";

let vapid: boolean | null = null;
export function pushConfigured(): boolean {
  if (vapid !== null) return vapid;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapid = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:kontakt@balancecocktails.pl", pub, priv);
  return (vapid = true);
}

const asLang = (l: string): Lang => ((LANGS as readonly string[]).includes(l) ? (l as Lang) : "pl");
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

/** Polish free text (event titles, admin messages) in a hand language. */
async function fromPolish(text: string, lang: Lang): Promise<string> {
  if (lang === "pl" || !text) return text;
  return (await translateMany([text], "pl", LANG_ISO[lang]))[text] ?? text;
}

/** A translatable DB field ({ pl, ru, en, ua } JSON) in a hand language. */
async function field(value: unknown, lang: Lang): Promise<string> {
  if (lang === "pl" || hasHand(value, lang)) return tr(value, lang);
  const src = hasHand(value, "en") ? "en" : "pl";
  const base = trBase(value);
  return (await translateMany([base], src, LANG_ISO[lang]))[base] ?? base;
}

/** Languages without hand-written UI text get the English message, machine-translated. */
async function localize(lang: Lang, build: (hand: Lang) => Promise<PushMessage>): Promise<PushMessage> {
  if (HAND_LANGS.includes(lang)) return build(lang);
  const en = await build("en");
  const map = await translateMany([en.title, en.body], "en", LANG_ISO[lang]);
  return { ...en, title: map[en.title] ?? en.title, body: map[en.body] ?? en.body };
}

/** "A, B, C i jeszcze 2" */
function listNames(names: string[], lang: Lang): string {
  const shown = names.slice(0, 3).join(", ");
  const rest = names.length - 3;
  return rest > 0 ? `${shown} ${fill(tDict("push.msg.more", lang), { n: rest })}` : shown;
}

// ---------------------------------------------------------------------------
// Sending

/** Sends one message (built per subscriber language) to everyone subscribed to `topic`. */
export async function sendToTopic(
  topic: PushTopic,
  build: (lang: Lang) => Promise<PushMessage>,
  source: Source
): Promise<{ sent: number; failed: number; configured: boolean }> {
  if (!pushConfigured()) return { sent: 0, failed: 0, configured: false };

  const subs = await prisma.pushSubscription.findMany({ where: { topics: { contains: `"${topic}"` } } });
  const byLang = new Map<Lang, Promise<PushMessage>>();
  const messageFor = (l: Lang) => {
    if (!byLang.has(l)) byLang.set(l, localize(l, build));
    return byLang.get(l)!;
  };

  let sent = 0;
  let failed = 0;
  const ok: number[] = [];
  const gone: number[] = [];
  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(
      subs.slice(i, i + 50).map(async (s) => {
        try {
          const msg = await messageFor(asLang(s.lang));
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(msg),
            { TTL: 24 * 3600, urgency: "normal" }
          );
          sent++;
          ok.push(s.id);
        } catch (e) {
          failed++;
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) gone.push(s.id); // unsubscribed / app removed
        }
      })
    );
  }
  if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  if (ok.length) await prisma.pushSubscription.updateMany({ where: { id: { in: ok } }, data: { lastSentAt: new Date() } });

  const pl = await messageFor("pl").catch(() => null);
  if (pl) {
    await prisma.pushLog.create({ data: { topic, source, title: pl.title, body: pl.body, url: pl.url, sent, failed } });
  }
  return { sent, failed, configured: true };
}

/** Admin message written in Polish (machine-translated for other languages). */
export function sendCustom(topic: PushTopic, msg: PushMessage, source: Source = "manual") {
  return sendToTopic(
    topic,
    async (lang) => ({ ...msg, title: await fromPolish(msg.title, lang), body: await fromPolish(msg.body, lang) }),
    source
  );
}

/** One of the ready-made invitations (hand-written in pl/ru/en/ua). */
export function sendPreset(preset: PromoText, url = "/", source: Source = "manual") {
  return sendToTopic(
    "promo",
    async (lang) => {
      const l = lang as keyof PromoText["title"];
      return { title: preset.title[l] ?? preset.title.en, body: preset.body[l] ?? preset.body.en, url, tag: "promo" };
    },
    source
  );
}

// ---------------------------------------------------------------------------
// Change queue

type Kind = "event" | "item" | "price" | "category";

/** Called by admin routes after a change. Never throws — a push problem must not break editing. */
export async function queueChange(kind: Kind, refId: number, oldPrice?: number): Promise<void> {
  try {
    if (kind === "event") {
      // Each event is announced once, the first time it is visible.
      if (await prisma.pushOutbox.findFirst({ where: { kind, refId }, select: { id: true } })) return;
    }
    if (kind === "price") {
      const pending = await prisma.pushOutbox.findFirst({
        where: { refId, sentAt: null, kind: { in: ["price", "item"] } },
        select: { id: true },
      });
      if (pending) return; // keep the first old price; a brand-new item is announced as new
    }
    await prisma.pushOutbox.create({ data: { kind, refId, oldPrice: oldPrice ?? null } });
  } catch {
    /* push tables missing or DB hiccup — editing goes on */
  }
}

/** Sends the queued changes once editing has been quiet for a while (or right away with `force`). */
export async function flushOutbox(force = false): Promise<{ sent: number; waiting?: boolean }> {
  const pending = await prisma.pushOutbox.findMany({ where: { sentAt: null }, orderBy: { createdAt: "asc" } });
  if (!pending.length) return { sent: 0 };
  const now = Date.now();
  const newest = +pending[pending.length - 1].createdAt;
  const oldest = +pending[0].createdAt;
  if (!force && now - newest < QUIET_MS && now - oldest < MAX_WAIT_MS) return { sent: 0, waiting: true };

  // Claim the rows first, so two overlapping requests don't both send.
  const ids = pending.map((p) => p.id);
  const claimed = await prisma.pushOutbox.updateMany({ where: { id: { in: ids }, sentAt: null }, data: { sentAt: new Date() } });
  if (claimed.count === 0) return { sent: 0 };

  const refs = (k: Kind) => Array.from(new Set(pending.filter((p) => p.kind === k).map((p) => p.refId)));
  let sent = 0;

  // Events: one notification each.
  const events = await prisma.event.findMany({ where: { id: { in: refs("event") }, enabled: true, endsAt: { gt: new Date() } } });
  for (const e of events) {
    const r = await sendToTopic(
      "events",
      async (lang) => ({
        title: tDict("push.msg.eventTitle", lang),
        body: `${await fromPolish(e.title, lang)} · ${formatEventRange(e.startsAt.toISOString(), e.endsAt.toISOString(), LANG_ISO[lang])}`,
        url: "/wydarzenia",
        tag: `event-${e.id}`,
      }),
      "auto"
    );
    sent += r.sent;
  }

  // New categories.
  const cats = await prisma.category.findMany({ where: { id: { in: refs("category") } }, orderBy: { order: "asc" } });
  const catIds = new Set(cats.map((c) => c.id));
  if (cats.length) {
    const r = await sendToTopic(
      "menu",
      async (lang) => ({
        title: tDict("push.msg.categoryTitle", lang),
        body: fill(tDict("push.msg.categoryBody", lang), { names: listNames(await Promise.all(cats.map((c) => field(c.name, lang))), lang) }),
        url: "/menu",
        tag: "menu-category",
      }),
      "auto"
    );
    sent += r.sent;
  }

  // New items (not the ones inside a new category — that one is already announced).
  const newIds = refs("item");
  const items = (await prisma.menuItem.findMany({ where: { id: { in: newIds }, available: true }, orderBy: { order: "asc" } }))
    .filter((i) => !catIds.has(i.categoryId) && !PLACEHOLDER_NAMES.has(tr(i.name, "pl").trim()));
  if (items.length) {
    const r = await sendToTopic(
      "menu",
      async (lang) => {
        const names = await Promise.all(items.map((i) => field(i.name, lang)));
        return items.length === 1
          ? { title: tDict("push.msg.itemTitle", lang), body: `${names[0]} — ${formatPrice(items[0].price)}`, url: "/menu", tag: "menu-new" }
          : { title: tDict("push.msg.itemsTitle", lang), body: listNames(names, lang), url: "/menu", tag: "menu-new" };
      },
      "auto"
    );
    sent += r.sent;
  }

  // Price changes that still differ from the price before editing.
  const firstOld = new Map<number, number>();
  pending.filter((p) => p.kind === "price" && p.oldPrice != null).forEach((p) => {
    if (!firstOld.has(p.refId)) firstOld.set(p.refId, p.oldPrice!);
  });
  const changed = (await prisma.menuItem.findMany({ where: { id: { in: Array.from(firstOld.keys()) }, available: true } }))
    .filter((i) => !newIds.includes(i.id) && Math.abs(i.price - firstOld.get(i.id)!) >= 0.01);
  if (changed.length) {
    const r = await sendToTopic(
      "menu",
      async (lang) => {
        const names = await Promise.all(changed.map((i) => field(i.name, lang)));
        const body = changed.length === 1
          ? `${names[0]}: ${formatPrice(changed[0].price)}`
          : fill(tDict("push.msg.priceBody", lang), { names: listNames(names, lang) });
        return { title: tDict("push.msg.priceTitle", lang), body, url: "/menu", tag: "menu-price" };
      },
      "auto"
    );
    sent += r.sent;
  }

  return { sent };
}

// Page views check the queue in the background, at most once a minute per server instance.
let lastKick = 0;
export function kickPushQueue(): void {
  if (Date.now() - lastKick < 60_000 || !pushConfigured()) return;
  lastKick = Date.now();
  waitUntil(flushOutbox().catch(() => undefined));
}

// ---------------------------------------------------------------------------
// Daily cron: queue fallback, automatic invitation, cleanup.

const WARSAW_DAY = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", weekday: "short" });
const DAY_NO: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const warsawDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(d);

export async function getPushConfig() {
  return prisma.pushConfig.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

export async function runDailyPush(now = new Date()) {
  const flushed = await flushOutbox();

  let promo: { sent: number } | null = null;
  const cfg = await getPushConfig();
  const days: number[] = JSON.parse(cfg.promoDays || "[]");
  const today = DAY_NO[WARSAW_DAY.format(now)];
  const alreadyToday = cfg.lastPromoAt && warsawDate(cfg.lastPromoAt) === warsawDate(now);
  if (cfg.autoPromo && days.includes(today) && !alreadyToday) {
    promo = await sendPreset(presetForDay(now), "/", "schedule");
    await prisma.pushConfig.update({ where: { id: 1 }, data: { lastPromoAt: now } });
  }

  // Subscriptions that never received anything in 12 months are dead weight.
  const cutoff = new Date(+now - INACTIVE_MS);
  const purged = await prisma.pushSubscription.deleteMany({
    where: { createdAt: { lt: cutoff }, OR: [{ lastSentAt: null }, { lastSentAt: { lt: cutoff } }] },
  });
  await prisma.pushOutbox.deleteMany({ where: { sentAt: { lt: new Date(+now - 30 * 86_400_000) } } });

  return { flushed, promo, purged: purged.count };
}
