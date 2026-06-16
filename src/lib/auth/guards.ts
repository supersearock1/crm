import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/auth/types";

export async function getCurrentSessionWithProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profileBySession } = await supabase
    .from("profiles")
    .select("id,email,role,status,is_primary_admin,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  let profile = profileBySession;

  if (!profile) {
    // Fallback for edge cases where session context is delayed after sign in.
    const adminClient = createAdminClient();
    const { data: profileByAdmin } = await adminClient
      .from("profiles")
      .select("id,email,role,status,is_primary_admin,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle<Profile>();
    profile = profileByAdmin;
  }

  return { user, profile };
}

export async function requireAuthenticated() {
  const { user, profile } = await getCurrentSessionWithProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.status === "blocked") {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?error=Account%20is%20blocked.%20Contact%20admin.");
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireAuthenticated();

  if (profile.role !== "admin" || !profile.is_primary_admin) {
    redirect("/dashboard?error=Admin%20access%20required.");
  }

  return { user, profile };
}

export async function requireAgent() {
  const { user, profile } = await requireAuthenticated();

  if (profile.role !== "agent") {
    if (profile.role === "admin" && profile.is_primary_admin) {
      redirect("/admin/dashboard");
    }
    redirect("/dashboard?error=Agent%20access%20required.");
  }

  return { user, profile };
}

export async function requireActiveAgent() {
  const { user, profile } = await requireAgent();

  if (profile.status === "readonly") {
    redirect("/dashboard?error=Account%20is%20read-only.%20You%20can%20view%20data%20but%20cannot%20make%20changes.");
  }

  return { user, profile };
}
