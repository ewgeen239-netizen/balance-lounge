"use client";

import type { Lang } from "./i18n";
import type { PushTopic } from "./pushTopics";

// Browser side of the installed app: platform detection, service worker,
// notification permission and the subscription stored on our server.

export type Platform = "ios-safari" | "ios-other" | "android" | "mac-safari" | "desktop";

export const OPEN_PUSH_SETTINGS = "balance:push-settings";
export const OPEN_INSTALL_GUIDE = "balance:install-guide";
/** Fired after this device was subscribed, so the layout can show the "notifications on" toast. */
export const PUSH_ENABLED_EVENT = "balance:push-enabled";
/** Set when the guest switches notifications off in the settings — the reminder then stays away. */
export const PUSH_OFF_KEY = "balance_push_off";
export const openPushSettings = () => window.dispatchEvent(new Event(OPEN_PUSH_SETTINGS));
export const openInstallGuide = () => window.dispatchEvent(new Event(OPEN_INSTALL_GUIDE));

export function platform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch points give it away.
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|GSA\//.test(ua) ? "ios-other" : "ios-safari";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "mac-safari";
  return "desktop";
}

/** Running as the installed app (home screen / dock), not in a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Registered on page load, so enabling notifications doesn't wait for it.
let registration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => (registration = reg))
    .catch(() => null);
}

function keyBytes(base64url: string): ArrayBuffer {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0)).buffer;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

async function api<T>(payload: unknown): Promise<T> {
  const res = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`push_api_${res.status}`);
  return res.json();
}

export type PushState = { permission: NotificationPermission | "unsupported"; topics: PushTopic[] };

export async function readPushState(): Promise<PushState> {
  if (!pushSupported()) return { permission: "unsupported", topics: [] };
  const sub = await currentSubscription();
  if (!sub || Notification.permission !== "granted") return { permission: Notification.permission, topics: [] };
  try {
    const { topics } = await api<{ topics: PushTopic[] }>({ action: "status", endpoint: sub.endpoint });
    return { permission: "granted", topics };
  } catch {
    return { permission: "granted", topics: [] };
  }
}

/**
 * Turns notifications on for this device (must run straight from a tap: iOS
 * shows its permission prompt only in answer to one) and stores the topics.
 * Same order as Apple's own example: ask for permission first, then subscribe.
 * Returns the resulting permission.
 */
export async function enablePush(topics: PushTopic[], lang: Lang): Promise<NotificationPermission> {
  // First statement, no await before it — keeps the tap's user activation.
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return permission;

  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("push_not_configured");
  const reg = registration ?? (await registerServiceWorker());
  if (!reg) throw new Error("no_service_worker");
  await navigator.serviceWorker.ready;

  // Throws NotAllowedError when the push service refuses (e.g. notifications
  // blocked at OS level, or the iOS Simulator, which has no Web Push).
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  await api({ action: "save", subscription: sub.toJSON(), topics, lang });
  local.set(PUSH_OFF_KEY, "");
  window.dispatchEvent(new CustomEvent(PUSH_ENABLED_EVENT, { detail: topics }));
  return "granted";
}

/** Saves a new topic choice (or language) for an already subscribed device. */
export async function updatePush(topics: PushTopic[], lang: Lang): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  if (!topics.length) return disablePush();
  await api({ action: "save", subscription: sub.toJSON(), topics, lang });
}

/** Withdraws consent: forget the device on our side and drop the browser subscription. */
export async function disablePush(): Promise<void> {
  local.set(PUSH_OFF_KEY, "1");
  const sub = await currentSubscription();
  if (!sub) return;
  await api({ action: "remove", endpoint: sub.endpoint }).catch(() => null);
  await sub.unsubscribe().catch(() => false);
}

// Per-device UI memory (collapsed card, "not now"). Storage may be unavailable
// (private mode) — then the UI simply behaves as on a first visit.
export const local = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
};
