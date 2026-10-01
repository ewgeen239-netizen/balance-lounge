// Cookie consent (RODO / ePrivacy). The visitor's choice is stored in a
// first-party cookie for 12 months; optional categories stay OFF until the
// visitor turns them on. Components read it with useConsent() and react to
// changes through the CONSENT_EVENT.
//
// Bump CONSENT_VERSION when the list of tools changes materially — everyone
// is asked again.

export const CONSENT_COOKIE = "balance_consent";
export const CONSENT_VERSION = 1;
const MAX_AGE_DAYS = 365;

export const CONSENT_EVENT = "balance:consent";
export const OPEN_SETTINGS_EVENT = "balance:cookie-settings";

export type ConsentCategory = "necessary" | "analytics" | "external" | "marketing";

export type Consent = {
  v: number;
  at: string; // ISO time the choice was made
  necessary: true;
  analytics: boolean; // Vercel Web Analytics
  external: boolean; // embedded third-party content (Google Maps)
  marketing: boolean; // reserved — no marketing tools yet
};

export const DENY_ALL: Omit<Consent, "at"> = { v: CONSENT_VERSION, necessary: true, analytics: false, external: false, marketing: false };
export const ALLOW_ALL: Omit<Consent, "at"> = { v: CONSENT_VERSION, necessary: true, analytics: true, external: true, marketing: true };

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(CONSENT_COOKIE + "="));
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as Consent;
    return c.v === CONSENT_VERSION ? c : null; // outdated choice → ask again
  } catch {
    return null;
  }
}

export function saveConsent(choice: Omit<Consent, "at" | "v" | "necessary">): Consent {
  const c: Consent = { v: CONSENT_VERSION, at: new Date().toISOString(), necessary: true, ...choice };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(c))}; path=/; max-age=${MAX_AGE_DAYS * 86400}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  return c;
}

/** Opens the cookie settings window from anywhere (e.g. the footer link). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
