"use client";

import { useEffect, useState } from "react";

type Member = { id: number; username: string; role: string; createdAt: string };

export function MembersPanel({ currentName }: { currentName: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", role: "staff" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/members");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      setForm({ username: "", password: "", role: "staff" });
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error === "username_taken" ? "Username already exists." : "Could not create member.");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this member?")) return;
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (res.ok) setMembers((m) => m.filter((x) => x.id !== id));
    else {
      const j = await res.json().catch(() => ({}));
      alert(j.error === "last_owner" ? "Cannot delete the last owner." : j.error === "cannot_delete_self" ? "You cannot delete yourself." : "Delete failed.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <h2 className="wordmark mb-1 text-2xl text-neutral-50">Members</h2>
        <p className="mb-6 text-sm text-neutral-500">
          <b className="text-neutral-300">Owner</b> — full access. <b className="text-neutral-300">Staff</b> — reservations only (no menu/content editing).
        </p>

        {loading ? (
          <p className="text-neutral-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-ink-800/60 text-left text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-neutral-100">
                      {m.username}
                      {m.username === currentName && <span className="ml-2 text-xs text-neutral-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.role === "owner" ? "text-ember" : "text-sky-300"}>{m.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(m.id)} className="text-xs text-neutral-500 hover:text-neon">delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={add} className="glass h-fit space-y-4 rounded-2xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ember">Add member</h3>
        <div>
          <label className="label">Username</label>
          <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="input" required minLength={2} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input" required minLength={6} />
        </div>
        <div>
          <label className="label">Role</label>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input">
            <option value="staff">Staff — reservations only</option>
            <option value="owner">Owner — full access</option>
          </select>
        </div>
        {err && <p className="rounded-xl border border-neon/40 bg-neon/10 px-4 py-2 text-sm text-neon">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? "Adding…" : "Add member"}</button>
      </form>
    </div>
  );
}
