"use client";

import { useLang } from "@/components/LangProvider";
import { openCookieSettings } from "@/lib/consent";
import { openPushSettings } from "@/lib/pushClient";

/** For visitors reading in another language: the Polish text is the binding one. */
export function BindingNote() {
  const { t, lang } = useLang();
  if (lang === "pl") return null;
  const note = t("privacy.binding");
  return note ? <p className="mt-2 text-sm text-amber-200/80">{note}</p> : null;
}

export function CookieSettingsButton() {
  const { t } = useLang();
  return (
    <button onClick={openCookieSettings} className="btn-ghost text-sm">
      {t("footer.cookies")}
    </button>
  );
}

export function PushSettingsButton() {
  const { t } = useLang();
  return (
    <button onClick={openPushSettings} className="btn-ghost text-sm">
      {t("push.settings")}
    </button>
  );
}
