import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/config/url";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const fromReset = params.from === "reset";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && !fromReset) {
    redirect("/dashboard");
  }
  const message =
    typeof params.message === "string"
      ? decodeURIComponent(params.message)
      : undefined;
  const error =
    typeof params.error === "string"
      ? decodeURIComponent(params.error)
      : undefined;

  return (
    <main className="min-h-screen bg-[#F4F1ED] p-4 md:p-8 flex items-center justify-center">
      <div className="grid min-h-[86vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#E0DDD9] bg-[#f8f6f3] shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:grid-cols-[1.12fr_1fr]">
        <section className="hidden lg:flex bg-[#1A1A1A] text-white p-10 flex-col justify-between">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#E55B3C]">Super Sea Rock Real Estate</p>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Account Recovery</p>
            <h2 className="mt-5 text-4xl leading-tight tracking-tight">Secure password reset in one step.</h2>
            <p className="max-w-md text-base text-gray-300 leading-relaxed">
              Enter your registered agency email and we will instantly send a
              secure reset link so you can regain access without delay.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>- Email link expires for security</p>
              <p>- Admin can also trigger reset from panel</p>
              <p>- No public account recovery abuse exposure</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Agents can reset using email link. Admin can also trigger resets from
            the admin panel.
          </p>
        </section>

        <Card className="border-0 rounded-none bg-transparent shadow-none h-full flex justify-center">
          <div className="w-full max-w-lg mx-auto">
            <CardHeader className="px-7 pt-9 md:px-10 md:pt-12 pb-4">
              <CardTitle className="text-3xl tracking-tight">Forgot password?</CardTitle>
              <CardDescription className="text-base">
                Enter your agency email to receive a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-7 pb-8 md:px-10 md:pb-12 space-y-5">
              <ForgotPasswordForm
                action={sendResetLinkAction}
                initialMessage={message}
                initialError={error}
              />
              <p className="text-sm text-gray-600">
                Back to{" "}
                <Link href="/login" className="text-[#1A1A1A] underline">
                  sign in
                </Link>
              </p>
            </CardContent>
          </div>
        </Card>
      </div>
    </main>
  );
}

type ForgotPasswordFormState = {
  message?: string;
  error?: string;
};

async function sendResetLinkAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message: "If the email exists, a reset link has been sent.",
  };
}
