import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminToastListener } from "@/components/admin/admin-toast-listener";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = await requireAdmin();
  const adminClient = createAdminClient();
  const { count } = await adminClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);
  const unreadNotificationsCount = count ?? 0;
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    {
      href: "/admin/notifications",
      label: "Notifications",
      badgeCount: unreadNotificationsCount,
    },
    { href: "/admin/agents", label: "Agents" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/distribution", label: "Distribution" },
    { href: "/admin/follow-ups", label: "Follow-ups" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <main className="min-h-screen bg-[#F4F1ED] p-2 md:p-3">
      <div className="mx-auto grid w-full max-w-[98vw] grid-cols-1 gap-3 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-[#E0DDD9] bg-white/70 p-5 md:p-6 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
          <div className="border-b border-[#EAE7E2] pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#E55B3C]">Super Sea Rock Real Estate</p>
            <h2 className="mt-2 text-xl tracking-tight text-[#1A1A1A]">Admin Console</h2>
          </div>

          <AdminSidebarNav items={navItems} />

          <div className="mt-6 rounded-xl border border-[#EAE7E2] bg-[#F9F8F6] p-3 text-xs text-gray-600">
            Signed in as:
            <p className="mt-1 truncate font-medium text-[#1A1A1A]">{profile.email}</p>
          </div>

          <form action={signOutAction} className="mt-5">
            <AdminFormSubmitButton
              idleText="Logout"
              pendingText="Logging out..."
              variant="outline"
              className="w-full rounded-xl border border-[#E0DDD9] px-3 py-3 text-base text-[#1A1A1A] hover:bg-[#F4F1ED]"
            />
          </form>
        </aside>

        <section className="min-w-0 rounded-2xl border border-[#E0DDD9] bg-white/70 p-5 md:p-7">
          <AdminToastListener />
          <Toaster richColors position="bottom-right" />
          {children}
        </section>
      </div>
    </main>
  );
}

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
