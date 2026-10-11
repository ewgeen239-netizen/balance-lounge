import { z } from "zod";
import { MENU_GROUPS } from "./menuGroups";

export const imageReference = z.string().max(2048).refine(v => v === "" || /^https:\/\//.test(v) || /^\/(?!\/)[a-zA-Z0-9/_ .%()-]+$/.test(v), "Image must use HTTPS or a same-site path");
const text = z.string().max(4000);
const name = z.string().trim().min(1).max(250);
const translation = z.object({ name: z.string().max(250), description: text });
export const mobileItemSchema = z.object({
  id: z.string(), remoteID: z.number().int().positive().optional(), remoteCategoryID: z.number().int().positive().nullable().optional(),
  name, descriptionKey: text, category: z.enum(["shisha", "cozy", "bar", "alcohol", "tea", "cold", "desserts", "information", "responsibility"]),
  price: z.number().finite().min(0).max(100000), image: imageReference,
  badgeKey: z.string().max(100), available: z.boolean(),
  translations: z.record(translation).optional(), updatedAt: z.string().optional(),
});
export const contentSchema = z.object({
  promotions: z.array(z.object({ id: z.string().uuid(), title: name, detail: text, image: imageReference, active: z.boolean() })).max(100),
  events: z.array(z.object({ id: z.string().uuid(), title: name, detail: text, date: z.string().datetime({ offset: true }), image: imageReference.optional().nullable(), active: z.boolean() })).max(100),
  discounts: z.array(z.object({ id: z.string().uuid(), name, percent: z.number().int().min(1).max(100), birthdayOnly: z.boolean(), active: z.boolean() })).max(100),
});
export type SharedContent = z.infer<typeof contentSchema>;
export const emptyContent: SharedContent = { promotions: [], events: [], discounts: [] };
export const hoursSchema = z.array(z.object({ weekday: z.number().int().min(1).max(7), opens: z.number().int().min(0).max(1410).multipleOf(30), closes: z.number().int().min(30).max(2160).multipleOf(30), enabled: z.boolean() }).refine(v => !v.enabled || (v.closes > v.opens && v.closes - v.opens <= 1440))).length(7).refine(rows => new Set(rows.map(r => r.weekday)).size === 7);
export const venueSchema = z.object({ name, address: name, phone: z.string().regex(/^\+?[0-9 ()-]{7,24}$/), email: z.union([z.literal(""), z.string().email()]), instagram: z.union([z.literal(""), z.string().url().startsWith("https://")]), heroImage: imageReference, heroTitle: text, heroSubtitle: text, hours: hoursSchema });
export type MobileGroup = z.infer<typeof mobileItemSchema>["category"];
export function menuGroup(slug: string): MobileGroup {
  if (slug === "informacje") return "information";
  if (slug === "odpowiedzialnosc") return "responsibility";
  if (slug === "shisha") return "shisha";
  if (slug.includes("cozy")) return "cozy";
  const index = MENU_GROUPS.findIndex(g => g.slugs.includes(slug));
  return ({ 1: "bar", 2: "alcohol", 3: "tea", 4: "cold", 5: "desserts" } as Record<number, MobileGroup>)[index] ?? "bar";
}
export function parseJSON<T>(value: string | null | undefined, fallback: T): T { try { return JSON.parse(value || ""); } catch { return fallback; } }
export function toMinutes(value: string): number { const [h, m] = value.split(":").map(Number); return Number.isFinite(h + m) ? h * 60 + m : 0; }
export function clock(value: number): string { return `${String(Math.floor(value / 60) % 24).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
