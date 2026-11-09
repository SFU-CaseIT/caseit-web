import { signOut } from "./actions";
import AdminWorkbookEditorLoader from "@/components/admin/AdminWorkbookEditorLoader";
import AdminPushNotifications from "@/components/admin/AdminPushNotifications";
import InstallAppButton from "@/components/admin/InstallAppButton";
import { SignOutSubmitButton } from "@/components/admin/SignOutSubmitButton";
import { WorkbookListProvider } from "@/components/admin/WorkbookListContext";
import FadeIn from "@/components/animations/FadeIn";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// DEFAULT /ADMIN PAGE (PROTECTED)

async function requireAdminAccess() {
  const startedAt = performance.now();
  const supabase = await createClient();
  const claimsStartedAt = performance.now();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claimsMs = performance.now() - claimsStartedAt;
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    console.info("[admin-auth] access check", {
      claimsMs: Math.round(claimsMs),
      roleMs: null,
      totalMs: Math.round(performance.now() - startedAt),
    });
    redirect("/admin/login");
  }

  const roleStartedAt = performance.now();
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  const roleMs = performance.now() - roleStartedAt;

  console.info("[admin-auth] access check", {
    claimsMs: Math.round(claimsMs),
    roleMs: Math.round(roleMs),
    totalMs: Math.round(performance.now() - startedAt),
  });

  if (adminError || !admin?.user_id) {
    redirect("/admin/login?error=You+do+not+have+admin+access.");
  }
}

export default async function AdminDashboard() {
  await requireAdminAccess();
  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24">
      <WorkbookListProvider>
        <FadeIn className="rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-5 border-b border-black/10 px-2 pb-6 sm:px-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-redDark">CaseIT 2027</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">Logistics</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div id="workbook-sync-action" />
              <AdminPushNotifications />
              <form action={signOut}>
                <SignOutSubmitButton />
              </form>
              <InstallAppButton />
            </div>
          </header>
          <AdminWorkbookEditorLoader />
        </FadeIn>
      </WorkbookListProvider>
    </main>
  );
}
