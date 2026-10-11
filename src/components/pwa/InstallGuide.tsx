"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import type { Platform } from "@/lib/pushClient";

/** The browser's own install prompt (Chrome/Edge on Android and desktop). */
export type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);
const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

type Step = { icon: React.ReactNode; text: string; hint?: string };

export function InstallGuide({
  platform,
  installEvent,
  onInstalled,
  onDone,
}: {
  platform: Platform;
  installEvent: InstallEvent | null;
  onInstalled: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const reduce = useReducedMotion();

  const steps: Step[] =
    platform === "ios-safari" || platform === "ios-other"
      ? [
          { icon: <ShareIcon />, text: t("install.ios1"), hint: t("install.ios1alt") },
          { icon: <AddIcon />, text: t("install.ios2") },
          { icon: <CheckIcon />, text: t("install.ios3") },
        ]
      : platform === "android"
        ? [
            { icon: <DotsIcon />, text: t("install.android1") },
            { icon: <AddIcon />, text: t("install.android2") },
            { icon: <CheckIcon />, text: t("install.android3") },
          ]
        : platform === "mac-safari"
          ? [{ icon: <AddIcon />, text: t("install.desktopSafari") }]
          : [{ icon: <AddIcon />, text: t("install.desktop1") }];
  steps.push({ icon: <BellIcon />, text: t("install.last") });

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") onInstalled();
  }

  return (
    <div>
      <div className="flex items-center gap-3 pr-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl border border-ember/30 shadow-ember" />
        <h2 className="text-lg font-medium leading-snug text-neutral-50">{t("install.sheetTitle")}</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-400">{t("install.why")}</p>

      {platform === "ios-other" && (
        <p className="mt-3 rounded-2xl border border-ember/25 bg-ember/5 px-4 py-3 text-sm text-ember-soft">{t("install.iosOther")}</p>
      )}

      {installEvent && (
        <button onClick={install} className="btn-primary mt-5 w-full">{t("install.now")}</button>
      )}

      <ol className="mt-5 space-y-2.5">
        {steps.map((s, i) => (
          <motion.li
            key={i}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.07, duration: 0.3 }}
            className="flex gap-3 rounded-2xl border border-white/10 bg-ink-800/50 p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">{s.icon}</span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-sm leading-snug text-neutral-100">
                <span className="mr-1.5 font-semibold text-ember">{i + 1}.</span>
                {s.text}
              </span>
              {s.hint && <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{s.hint}</span>}
            </span>
          </motion.li>
        ))}
      </ol>

      <button onClick={onDone} className="btn-ghost mt-5 w-full">{t("install.done")}</button>
    </div>
  );
}
