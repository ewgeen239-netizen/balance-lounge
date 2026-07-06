"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";
import { cn } from "@/lib/utils";

export function AuthForm() {
  const { t } = useLang();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const url = mode === "login" ? "/api/auth/guest/login" : "/api/auth/guest/signup";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto max-w-md rounded-3xl p-8">
      <div className="mb-8 flex rounded-full border border-white/10 p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setErr(""); }}
            className={cn("flex-1 rounded-full py-2 text-sm transition", mode === m ? "bg-neon text-white" : "text-neutral-400")}
          >
            {t(m === "login" ? "acc.login" : "acc.signup")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="label">{t("book.name")}</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t("book.phone")}</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" />
            </div>
          </>
        )}
        <div>
          <label className="label">{t("acc.email")}</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">{t("acc.password")}</label>
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="input" required minLength={6} />
        </div>

        {err && (
          <p className="rounded-xl border border-neon/40 bg-neon/10 px-4 py-2 text-sm text-neon">
            {err === "invalid_credentials" ? "Invalid email or password." : err === "email_taken" ? "Email already registered." : t("common.error")}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? t("common.loading") : t(mode === "login" ? "acc.login" : "acc.signup")}
        </button>
      </form>
    </motion.div>
  );
}
