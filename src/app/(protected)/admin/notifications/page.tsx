import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import type { AppNotification } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminNotificationsPage() {
  const { profile } = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: notifications } = await adminClient
    .from("notifications")
    .select("id,user_id,title,message,notification_type,entity_type,entity_id,is_read,read_at,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(80)
    .returns<AppNotification[]>();

  const items = notifications ?? [];
  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl tracking-tight text-[#1A1A1A]">Notifications</h1>
          <p className="text-sm text-gray-600">
            {unreadCount} unread of {items.length}
          </p>
        </div>
        <form action={markAllAdminNotificationsReadAction}>
          <AdminFormSubmitButton
            idleText="Mark all read"
            pendingText="Marking..."
            variant="outline"
            className="rounded-md border border-[#E0DDD9] px-3 py-1.5 text-xs text-[#1A1A1A] hover:bg-[#F4F1ED]"
          />
        </form>
      </div>

      <Card className="border-[#E0DDD9] bg-white">
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {items.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
          {items.map((item) => (
            <div key={item.id} className={`rounded-lg border p-3 ${item.is_read ? "border-[#EAE7E2] bg-[#FAF9F7]" : "border-[#FAD7CE] bg-[#FFF5F2]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.is_read && (
                  <form action={markSingleAdminNotificationReadAction}>
                    <input type="hidden" name="notification_id" value={item.id} />
                    <AdminFormSubmitButton
                      idleText="Mark read"
                      pendingText="Marking..."
                      variant="outline"
                      className="rounded-md border border-[#E0DDD9] px-2 py-1 text-[11px] text-[#1A1A1A] hover:bg-[#F4F1ED]"
                    />
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

async function markAllAdminNotificationsReadAction() {
  "use server";
  const { profile } = await requireAdmin();
  const adminClient = createAdminClient();
  await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("is_read", false);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/dashboard");
  redirect("/admin/notifications");
}

async function markSingleAdminNotificationReadAction(formData: FormData) {
  "use server";
  const { profile } = await requireAdmin();
  const adminClient = createAdminClient();
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!notificationId) redirect("/admin/notifications");

  await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/dashboard");
  redirect("/admin/notifications");
}
