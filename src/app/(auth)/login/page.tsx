import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message =
    typeof params.message === "string"
      ? decodeURIComponent(params.message)
      : undefined;
  const error =
    typeof params.error === "string"
      ? decodeURIComponent(params.error)
      : undefined;

  return (
    <main className="min-h-screen bg-[#F4F1ED] p-4 md:p-8">
      <div className="mx-auto grid min-h-[86vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#E0DDD9] bg-[#f8f6f3] shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:grid-cols-[1.12fr_1fr]">
        <section className="relative overflow-hidden bg-[#161616] p-8 md:p-12 text-white">
          <div className="absolute -top-40 -right-20 h-80 w-80 rounded-full bg-[#E55B3C]/20 blur-3xl" />
          <div className="absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="space-y-7">
              <p className="text-xs uppercase tracking-[0.26em] text-[#E55B3C]">Super Sea Rock Real Estate Platform</p>
              <h1 className="max-w-lg text-4xl md:text-5xl leading-[1.08] tracking-tight">
                Run your agency with one premium command center.
              </h1>
              <p className="max-w-md text-base text-gray-300 leading-relaxed">
                Designed for real estate teams that need speed, visibility, and
                zero missed follow-ups.
              </p>

              <div className="grid gap-3 pt-2 text-sm text-gray-200">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E55B3C]" />
                  Real-time lead and pipeline tracking
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E55B3C]" />
                  Role-secure admin and agent access
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E55B3C]" />
                  Automated reminders and follow-up control
                </div>
              </div>
            </div>

            <div className="relative mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-gray-100">
                &quot;Our team now closes faster because everyone knows what to
                do next.&quot;
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-gray-300">
                Sales Admin - Super Sea Rock Real Estate
              </p>
            </div>
          </div>
        </section>

        <Card className="border-0 rounded-none bg-transparent shadow-none h-full flex justify-center">
          <div className="w-full max-w-lg mx-auto">
            <CardHeader className="px-7 pt-9 md:px-10 md:pt-12 pb-5">
              <CardTitle className="text-3xl tracking-tight text-[#1A1A1A]">Sign in to your account</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-8 md:px-10 md:pb-12">
              {message && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                  {message}
                </div>
              )}
              <LoginForm action={loginAction} initialError={error} />
            </CardContent>
          </div>
        </Card>
      </div>
    </main>
  );
}
type LoginFormState = {
  error?: string;
};

async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const user = signInData.user;

  if (!user) {
    return { error: "Unable to load user session." };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle<{ status: "active" | "blocked" | "readonly" }>();

  if (profile?.status === "blocked") {
    await supabase.auth.signOut();
    return { error: "Account is blocked. Contact admin." };
  }

  redirect("/dashboard");
}
