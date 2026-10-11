"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { useConsent } from "@/components/consent/CookieConsent";
import { BottomSheet } from "./BottomSheet";
import { InstallGuide, type InstallEvent } from "./InstallGuide";
import { InstallPrompt } from "./InstallPrompt";
import { PushSheet } from "./PushSheet";
import { PushToast, Toast } from "./PushToast";
import { PushNudge, type NudgeState } from "./PushNudge";
import { fill } from "@/lib/i18n";
import { INSTALL_BONUS, LOYALTY_LIVE } from "@/content/rewards";
import { POINTS_CHANGED } from "@/components/account/LoyaltyPanel";
import { AUTO_TOPICS } from "@/lib/pushTopics";
import {
  OPEN_INSTALL_GUIDE, OPEN_PUSH_SETTINGS, PUSH_ENABLED_EVENT, PUSH_OFF_KEY, enablePush, isStandalone, local, platform,
  pushSupported, readPushState, registerServiceWorker, updatePush, type Platform,
} from "@/lib/pushClient";

const COLLAPSED_KEY = "balance_pwa_collapsed";
const LANG_KEY = "balance_push_lang";

/**
 * Installed-app (PWA) layer, mounted once in the layout:
 * - registers the service worker;
 * - in a browser: "add to home screen" card on the home page and a small
 *   iPhone button on every other page → instructions;
 * - installed app: turns notifications on with the guest's first tap (after the
 *   cookie choice) — iOS shows its permission prompt only in answer to a tap —
 *   then a short "notifications on" message slides up;
 * - installed app: a reminder stays at the bottom until notifications are
 *   allowed (or, if the phone blocks them, explains how to unblock);
 * - footer "Notifications" link: topic settings and switching off;
 * - installed app with a logged-in guest: claims the "install the app" points
 *   bonus (the server grants it once per account);
 * - keeps the notification language in step with the site language.
 */
export function PwaRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useLang();
  const consent = useConsent();

  const [ready, setReady] = useState(false);
  const [plat, setPlat] = useState<Platform>("desktop");
  const [standalone, setStandalone] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [guide, setGuide] = useState(false);
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState(false);
  const [bonusToast, setBonusToast] = useState(false);
  const [nudge, setNudge] = useState<NudgeState>(null);

  useEffect(() => {
    registerServiceWorker();
    setPlat(platform());
    setStandalone(isStandalone());
    setCollapsed(local.get(COLLAPSED_KEY) === "1");
    setReady(true);

    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
    const onInstalled = () => setInstalled(true);
    const onGuide = () => setGuide(true);
    const onPush = () => setSettings(true);
    const onEnabled = () => setToast(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(OPEN_INSTALL_GUIDE, onGuide);
    window.addEventListener(OPEN_PUSH_SETTINGS, onPush);
    window.addEventListener(PUSH_ENABLED_EVENT, onEnabled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(OPEN_INSTALL_GUIDE, onGuide);
      window.removeEventListener(OPEN_PUSH_SETTINGS, onPush);
      window.removeEventListener(PUSH_ENABLED_EVENT, onEnabled);
    };
  }, []);

  // Installed app: the first tap after the cookie choice turns notifications on.
  // Only while the permission was never answered — a refusal, or switching off
  // in the footer settings, is never overridden.
  useEffect(() => {
    if (!ready || !standalone || !consent || !pushSupported() || Notification.permission !== "default") return;
    const onTap = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-push-nudge]")) return; // the reminder's own button asks
      document.removeEventListener("click", onTap, true);
      enablePush(AUTO_TOPICS, lang).then((p) => { if (p === "granted") local.set(LANG_KEY, lang); }).catch(() => undefined);
    };
    document.addEventListener("click", onTap, true);
    return () => document.removeEventListener("click", onTap, true);
  }, [ready, standalone, consent, lang]);

  // Reminder until notifications are on. Re-checked whenever the guest comes
  // back to the app (e.g. from iOS Settings) and after each change. Switching
  // them off in the footer settings is respected: no reminder then.
  const checkNudge = useCallback(async () => {
    if (!standalone || !consent || !pushSupported() || local.get(PUSH_OFF_KEY) === "1") return setNudge(null);
    const p = Notification.permission;
    if (p === "denied") return setNudge("blocked");
    if (p === "default") return setNudge("ask");
    const s = await readPushState().catch(() => null);
    setNudge(s && s.topics.length ? null : "ask");
  }, [standalone, consent]);

  useEffect(() => {
    if (!ready) return;
    checkNudge();
    const onVisible = () => { if (document.visibilityState === "visible") checkNudge(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PUSH_ENABLED_EVENT, checkNudge);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PUSH_ENABLED_EVENT, checkNudge);
    };
  }, [ready, checkNudge]);

  // Straight from the tap, so iOS shows its permission prompt.
  const enableFromNudge = useCallback(() => {
    enablePush(AUTO_TOPICS, lang)
      .then((p) => { if (p === "granted") local.set(LANG_KEY, lang); else setNudge(p === "denied" ? "blocked" : "ask"); })
      .catch(() => setNudge("blocked"));
  }, [lang]);

  // Installed app: claim the install bonus. Re-checked on each page change, so
  // logging in inside the app collects it straight away. A guest who is not
  // logged in gets a 401 and nothing happens; a granted bonus is never repeated.
  useEffect(() => {
    if (!LOYALTY_LIVE || !ready || !standalone || pathname.startsWith("/admin")) return;
    fetch("/api/account/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "install" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.granted) return;
        setBonusToast(true);
        window.dispatchEvent(new Event(POINTS_CHANGED));
      })
      .catch(() => undefined);
  }, [ready, standalone, pathname]);

  // Notifications follow the language the visitor reads the site in.
  useEffect(() => {
    if (!ready || !pushSupported() || Notification.permission !== "granted" || local.get(LANG_KEY) === lang) return;
    readPushState().then(async (s) => {
      if (!s.topics.length) return;
      await updatePush(s.topics, lang);
      local.set(LANG_KEY, lang);
    }).catch(() => undefined);
  }, [ready, lang]);

  const closeGuide = useCallback(() => setGuide(false), []);
  const closeSettings = useCallback(() => { setSettings(false); checkNudge(); }, [checkNudge]);
  const closeToast = useCallback(() => setToast(false), []);
  const openSettings = useCallback(() => setSettings(true), []);
  const closeBonus = useCallback(() => setBonusToast(false), []);
  const openAccount = useCallback(() => router.push("/account"), [router]);

  if (pathname.startsWith("/admin")) return null;

  // The full card greets visitors on the home page; every other page shows the
  // small iPhone button, so "how to install" is one tap away on every tab.
  const showCard = ready && !standalone && !installed && !!consent;
  const onHome = pathname === "/";

  return (
    <>
      {showCard && (
        <InstallPrompt
          collapsed={!onHome || collapsed}
          onCollapse={() => { setCollapsed(true); local.set(COLLAPSED_KEY, "1"); }}
          onOpen={() => setGuide(true)}
        />
      )}

      <BottomSheet open={guide} onClose={closeGuide} label={t("install.sheetTitle")}>
        <InstallGuide
          platform={plat}
          installEvent={installEvent}
          onInstalled={() => { setInstalled(true); setGuide(false); }}
          onDone={closeGuide}
        />
      </BottomSheet>

      <BottomSheet open={settings} onClose={closeSettings} label={t("push.settings")}>
        <PushSheet onClose={closeSettings} blocked={nudge === "blocked"} />
      </BottomSheet>

      <div data-push-nudge>
        <PushNudge state={settings ? null : nudge} onEnable={enableFromNudge} onHowTo={openSettings} />
      </div>
      <PushToast open={toast} onClose={closeToast} onChange={openSettings} />
      <Toast
        open={bonusToast && !toast}
        onClose={closeBonus}
        title={fill(t("loy.toastTitle"), { n: INSTALL_BONUS })}
        text={t("loy.toastText")}
        actionLabel={t("loy.see")}
        onAction={openAccount}
        icon={<span className="text-base font-semibold">+</span>}
      />
    </>
  );
}
