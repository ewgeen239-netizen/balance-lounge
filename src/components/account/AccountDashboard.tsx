"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { StatusBadge } from "@/components/StatusBadge";

type Resv = { id: number; date: string; time: string; guests: number; zone: string; status: string; comment: string };

export function AccountDashboard({
  name,
  email,
  reservations,
}: {
  name: string;
  email: string;
  reservations: Resv[];
}) {
  const { t } = useLang();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/guest/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl p-8">
        <div>
          <p className="text-sm text-neutral-400">{t("acc.hello")}</p>
          <h2 className="wordmark text-2xl text-neutral-50">{name || email}</h2>
          <p className="text-sm text-neutral-500">{email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/booking" className="btn-primary">{t("cta.bookTable")}</Link>
          <button onClick={logout} className="btn-ghost">{t("acc.logout")}</button>
        </div>
      </div>

      <h3 className="wordmark accent-underline mb-6 mt-12 text-xl text-neutral-50">{t("acc.history")}</h3>

      {reservations.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-800/40 p-8 text-center text-neutral-500">
          {t("acc.noHistory")}
        </p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => (
            <li key={r.id} className="glass card-hover flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
              <div>
                <p className="font-medium text-neutral-100">{r.date} — {r.time}</p>
                <p className="text-sm text-neutral-400">
                  {r.guests} {t("book.guests").toLowerCase()}
                </p>
                {r.comment && <p className="mt-1 text-sm text-neutral-500">{r.comment}</p>}
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
