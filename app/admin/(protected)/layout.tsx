import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

//CHECKS ROLE BEFORE VISITING ANY /ADMIN PAGES

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)

  if (adminError || !admin) {
    redirect("/admin/login?error=You+do+not+have+admin+access.");
  }

  return children;
}
