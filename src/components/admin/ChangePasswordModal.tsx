"use client";

import { useState } from "react";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (next.length < 6) return setErr("New password must be at least 6 characters.");
    if (next !== confirm) return setErr("Passwords do not match.");
    setStatus("loading");
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error === "wrong_current" ? "Current password is incorrect." : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-16 w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="wordmark text-xl text-neutral-50">Change password</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neon">✕</button>
        </div>

        {status === "done" ? (
          <div className="text-center">
            <p className="mb-6 text-emerald-400">Password changed successfully.</p>
            <button onClick={onClose} className="btn-primary w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Current password</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input" autoFocus required />
            </div>
            <div>
              <label className="label">New password</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="input" minLength={6} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" minLength={6} required />
            </div>
            {err && <p className="rounded-xl border border-neon/40 bg-neon/10 px-4 py-2 text-sm text-neon">{err}</p>}
            <button type="submit" disabled={status === "loading"} className="btn-primary w-full disabled:opacity-50">
              {status === "loading" ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
