"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { cn } from "@/lib/utils";
import { PUSH_TOPICS, type PushTopic } from "@/lib/pushTopics";
import {
  disablePush, enablePush, isStandalone, openInstallGuide, platform, readPushState, updatePush,
  type PushState,
} from "@/lib/pushClient";

/**
 * Notification settings behind the footer "Notifications" link: change topics,
 * switch everything off, or turn notifications on where they are still off.
 */
export function PushSheet({ onClose, blocked = false }: { onClose: () => void; blocked?: boolean }) {
  const { t, lang } = useLang();
  const [state, setState] = useState<PushState | null>(null);
  const [picked, setPicked] = useState<PushTopic[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    readPushState().then((s) => { setState(s); setPicked(s.topics); });
  }, []);

  const subscribed = !!state && state.permission === "granted" && state.topics.length > 0;
  const toggle = (tp: PushTopic) => setPicked((p) => (p.includes(tp) ? p.filter((x) => x !== tp) : [...p, tp]));

  async function turnOn(topics: PushTopic[]) {
    setBusy(true);
    setNote(null);
    try {
      const permission = await enablePush(topics, lang);
      if (permission !== "granted") {
        setState((s) => (s ? { ...s, permission } : s));
        if (permission === "denied") setNote(t("push.denied"));
        return;
      }
      setPicked(topics);
      setState({ permission: "granted", topics });
      setNote(t("push.saved"));
      window.setTimeout(onClose, 900);
    } catch {
      setNote(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await updatePush(picked, lang);
      setState({ permission: "granted", topics: picked });
      setNote(t("push.saved"));
    } catch {
      setNote(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function off() {
    setBusy(true);
    await disablePush();
    setPicked([]);
    setState((s) => (s ? { ...s, topics: [] } : s));
    setNote(t("push.statusOff"));
    setBusy(false);
  }

  const p = typeof window !== "undefined" ? platform() : "desktop";
  const iosTab = (p === "ios-safari" || p === "ios-other") && !isStandalone();

  // Situations where there is nothing to switch on here.
  let blocker: React.ReactNode = null;
  if (state?.permission === "unsupported") {
    blocker = iosTab ? (
      <>
        <p className="text-sm leading-relaxed text-neutral-300">{t("push.needInstall")}</p>
        <button onClick={() => { onClose(); openInstallGuide(); }} className="btn-primary mt-4 w-full">
          {t("install.reopen")}
        </button>
      </>
    ) : (
      <p className="text-sm text-neutral-300">{t("push.unsupported")}</p>
    );
  } else if (state?.permission === "denied") {
    blocker = <p className="text-sm leading-relaxed text-neutral-300">{t("push.denied")}</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 pr-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon/25 to-ember/20 text-ember">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </span>
        <h2 className="text-lg font-medium leading-snug text-neutral-50">{t("push.settings")}</h2>
      </div>

      {!state ? (
        <p className="mt-5 text-sm text-neutral-500">{t("common.loading")}</p>
      ) : blocker ? (
        <div className="mt-5">{blocker}</div>
      ) : (
        <>
          {/* The phone refused the subscription although the site permission looks granted. */}
          {blocked && !subscribed && (
            <p className="mt-3 rounded-2xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm leading-relaxed text-neutral-200">{t("push.denied")}</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            {(subscribed ? t("push.statusOn") : t("push.statusOff")) + " "}
            {t("push.text")}
          </p>

          <ul className="mt-4 space-y-2">
            {PUSH_TOPICS.map((tp) => {
              const on = picked.includes(tp);
              return (
                <li key={tp}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggle(tp)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition",
                      on ? "border-ember/40 bg-ember/5" : "border-white/10 bg-ink-800/50 hover:border-white/20"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-neutral-100">{t(`push.topic.${tp}`)}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">{t(`push.topic.${tp}Desc`)}</span>
                    </span>
                    <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition", on ? "bg-neon" : "bg-white/15")}>
                      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-col gap-2">
            {subscribed ? (
              <>
                <button onClick={save} disabled={busy} className="btn-primary w-full disabled:opacity-50">{t("push.save")}</button>
                <button onClick={off} disabled={busy} className="btn-ghost w-full disabled:opacity-50">{t("push.off")}</button>
              </>
            ) : (
              <>
                <button onClick={() => turnOn([...PUSH_TOPICS])} disabled={busy} className="btn-primary w-full disabled:opacity-50">
                  {t("push.allowAll")}
                </button>
                <button onClick={() => turnOn(picked)} disabled={busy || picked.length === 0} className="btn-ghost w-full disabled:opacity-40">
                  {t("push.allowSelected")}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {note && <p role="status" className="mt-3 text-center text-sm text-ember">{note}</p>}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-500">
        {t("push.privacy")}{" "}
        <Link href="/polityka-prywatnosci#powiadomienia" onClick={onClose} className="text-neutral-400 underline underline-offset-2 hover:text-ember">
          {t("footer.privacy")}
        </Link>
      </p>
    </div>
  );
}
