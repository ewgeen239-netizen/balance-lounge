import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Wordmark } from "@/components/Wordmark";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Wordmark className="text-3xl text-neutral-50" />
          <p className="mt-2 text-xs uppercase tracking-widest text-ember/70">Admin Panel</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
