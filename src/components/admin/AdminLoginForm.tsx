"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setErr("Invalid username or password.");
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-8">
      <div>
        <label className="label">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="input" autoFocus required />
      </div>
      <div>
        <label className="label">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
      </div>
      {err && <p className="rounded-xl border border-neon/40 bg-neon/10 px-4 py-2 text-sm text-neon">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "…" : "Log in"}
      </button>
      <p className="text-center text-xs text-neutral-500">Default: admin / balance123 — change on first login.</p>
    </form>
  );
}
